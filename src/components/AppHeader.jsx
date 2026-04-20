import { NavLink } from "react-router-dom";
import { navClassName } from "../utils/navigation";

function getAccountLabel(user) {
  if (!user) {
    return "Visitante";
  }

  if (user.role === "admin") {
    return `${user.name} | Admin`;
  }

  return `${user.name} | ${user.university}`;
}

function AppHeader({ user, onLogout }) {
  return (
    <>
      <div className="utility-bar">
        <span>Curadoria clínica de imagens, categorias e estudos de caso</span>
        <span>Acervo odontológico</span>
      </div>

      <header className="topbar">
        <div className="brand-block">
          <p className="eyebrow">Análise bucal</p>
          <div className="brand-mark">AB</div>
          <h1>Biblioteca clínica odontológica</h1>
        </div>

        <div className="header-center">
          <p className="header-label">Navegação</p>
          <nav className="nav-row">
            <NavLink to="/" className={navClassName}>
              Biblioteca
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
                <NavLink to="/admin/imagens" className={navClassName}>
                  Cadastro de imagens
                </NavLink>
                <NavLink to="/admin/categorias" className={navClassName}>
                  Categorias
                </NavLink>
                <NavLink to="/admin/administradores" className={navClassName}>
                  Administradores
                </NavLink>
              </>
            ) : null}
          </nav>
        </div>

        <div className="session-pill">
          <p className="session-label">Conta ativa</p>
          <span>{getAccountLabel(user)}</span>
          {user ? (
            <button className="secondary" type="button" onClick={onLogout}>
              Sair
            </button>
          ) : null}
        </div>
      </header>
    </>
  );
}

export default AppHeader;
