import { useState } from "react";
import { NavLink } from "react-router-dom";
import { navClassName } from "../utils/navigation";

function getAccountLabel(user) {
  if (!user) {
    return "Visitante";
  }

  if (user.role === "admin") {
    return "Admin";
  }

  return user.university;
}

function getInitials(user) {
  if (!user?.name) {
    return "IO";
  }

  return user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AppHeader({ user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="app-header">
      <div className="brand-link-block">
        <NavLink to="/" className="brand-link" onClick={closeMenu}>
          <span className="brand-wordmark">
            Img<span>Odonto</span>
          </span>
          <span className="brand-underline" />
        </NavLink>
      </div>

      <button
        className="mobile-menu-button"
        type="button"
        onClick={() => setMobileMenuOpen((current) => !current)}
        aria-label="Abrir menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>

      <nav className="app-nav desktop-nav">
        <NavLink to="/" className={navClassName}>
          Início
        </NavLink>
        {!user ? (
          <>
            <NavLink to="/login" className={navClassName}>
              Login
            </NavLink>
            <NavLink to="/cadastro" className={navClassName}>
              Cadastro
            </NavLink>
          </>
        ) : null}
        {user?.role === "admin" ? (
          <>
            <NavLink to="/admin/dashboard" className={navClassName}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/imagens" className={navClassName}>
              Imagens
            </NavLink>
            <NavLink to="/admin/categorias" className={navClassName}>
              Categorias
            </NavLink>
            <NavLink to="/admin/administradores" className={navClassName}>
              Admins
            </NavLink>
          </>
        ) : null}
        <NavLink to="/quem-somos" className={navClassName}>
          Quem somos
        </NavLink>
      </nav>

      <div className="header-account desktop-account">
        <div className="avatar-ring">{getInitials(user)}</div>
        <div className="header-account-copy">
          <strong>{user?.name || "ImgOdonto"}</strong>
          <span>{getAccountLabel(user)}</span>
        </div>
        {user ? (
          <button className="secondary compact-button" type="button" onClick={onLogout}>
            Sair
          </button>
        ) : null}
      </div>

      {mobileMenuOpen ? (
        <div className="mobile-nav-sheet">
          <NavLink to="/" className={navClassName} onClick={closeMenu}>
            Início
          </NavLink>
          {!user ? (
            <>
              <NavLink to="/login" className={navClassName} onClick={closeMenu}>
                Login
              </NavLink>
              <NavLink to="/cadastro" className={navClassName} onClick={closeMenu}>
                Cadastro
              </NavLink>
            </>
          ) : null}
          {user?.role === "admin" ? (
            <>
              <NavLink to="/admin/dashboard" className={navClassName} onClick={closeMenu}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/imagens" className={navClassName} onClick={closeMenu}>
                Imagens
              </NavLink>
              <NavLink to="/admin/categorias" className={navClassName} onClick={closeMenu}>
                Categorias
              </NavLink>
              <NavLink to="/admin/administradores" className={navClassName} onClick={closeMenu}>
                Admins
              </NavLink>
            </>
          ) : null}
          <NavLink to="/quem-somos" className={navClassName} onClick={closeMenu}>
            Quem somos
          </NavLink>

          {user ? (
            <div className="mobile-nav-account">
              <div className="avatar-ring">{getInitials(user)}</div>
              <div className="header-account-copy">
                <strong>{user.name}</strong>
                <span>{getAccountLabel(user)}</span>
              </div>
              <button
                className="secondary compact-button mobile-logout-button"
                type="button"
                onClick={() => {
                  closeMenu();
                  onLogout();
                }}
              >
                Sair
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export default AppHeader;
