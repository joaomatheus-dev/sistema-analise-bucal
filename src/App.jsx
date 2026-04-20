import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import AdminGuard from "./components/AdminGuard";
import AdminUsersPage from "./pages/AdminUsersPage";
import AuthPage from "./pages/AuthPage";
import CategoryAdminPage from "./pages/CategoryAdminPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import GalleryPage from "./pages/GalleryPage";
import ImageAdminPage from "./pages/ImageAdminPage";
import PostDetailPage from "./pages/PostDetailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { mergeGallerySources } from "./utils/images";

const storageKey = "analise-bucal-auth";

function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [categories, setCategories] = useState([]);

  function notify(payload) {
    if (payload?.type === "error" && payload.text) {
      window.alert(payload.text);
    }
  }

  async function api(path, options = {}) {
    const isJsonBody =
      options.body && typeof options.body === "string" && !options.headers?.["Content-Type"];

    const response = await fetch(path, {
      ...options,
      headers: {
        ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Falha na requisicao.");
    }

    return data;
  }

  async function loadCategories() {
    try {
      const data = await api("/api/categories");
      setCategories(data);
    } catch (error) {
      notify({ text: error.message, type: "error" });
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      setBooting(false);
      loadCategories();
      return;
    }

    const parsed = JSON.parse(saved);
    setToken(parsed.token || "");
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem(storageKey);
      if (!booting) {
        loadCategories();
      }
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify({ token }));
    api("/api/me")
      .then((currentUser) => {
        setUser(currentUser);
        setBooting(false);
        loadCategories();
      })
      .catch(() => {
        setToken("");
        setUser(null);
        setBooting(false);
      });
  }, [token]);

  useEffect(() => {
    if (!booting && !token) {
      setBooting(false);
    }
  }, [booting, token]);

  async function handleLogin(credentials) {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });

    setToken(data.token);
    setUser(data.user);
    navigate("/");
  }

  async function handleRegister(payload) {
    await api("/api/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    navigate("/login");
  }

  async function handleLogout() {
    try {
      if (token) {
        await api("/api/logout", { method: "POST" });
      }
    } catch (error) {
      notify({ text: error.message, type: "error" });
    } finally {
      setToken("");
      setUser(null);
      navigate("/");
    }
  }

  async function handlePasswordRecoveryRequest(email) {
    return await api("/api/password-recovery-request", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  async function handlePasswordReset(payload) {
    await api("/api/password-reset", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async function handleCreateImage(payload) {
    const category = payload.customCategory.trim() || payload.category;
    const imageGallery = mergeGallerySources(payload);
    await api("/api/images", {
      method: "POST",
      body: JSON.stringify({
        title: payload.title,
        category,
        imageUrl: imageGallery[0] || payload.imageUrl,
        imageGallery,
        description: payload.description
      })
    });

    await loadCategories();
  }

  async function handleUpdateImage(imageId, payload) {
    const category = payload.customCategory?.trim() || payload.category;
    const imageGallery = mergeGallerySources(payload);
    const data = await api(`/api/images/${imageId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: payload.title,
        category,
        imageUrl: imageGallery[0] || payload.imageUrl,
        imageGallery,
        description: payload.description
      })
    });

    await loadCategories();
    return data.image;
  }

  async function handleDeleteImage(imageId) {
    await api(`/api/images/${imageId}`, {
      method: "DELETE"
    });
  }

  async function handleCreateAdmin(payload) {
    const data = await api("/api/admins", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    return data.admin;
  }

  async function handleUpdateAdmin(adminId, payload) {
    const data = await api(`/api/admins/${adminId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });

    return data.admin;
  }

  async function handleDeleteAdmin(adminId) {
    await api(`/api/admins/${adminId}`, {
      method: "DELETE"
    });
  }

  async function handleImportDataset(file) {
    const fileName = String(file?.name || "").toLowerCase();
    if (!fileName.endsWith(".csv")) {
      throw new Error("Importacao permitida apenas para arquivos .csv.");
    }

    let content = "";

    try {
      content = await file.text();
    } catch (error) {
      throw new Error(
        "Nao foi possivel ler o arquivo selecionado. Tente mover o arquivo para uma pasta local comum, como Documentos."
      );
    }

    const data = await api("/api/datasets/import", {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        content
      })
    });

    await loadCategories();
    return data;
  }

  async function handleCreateCategory(name) {
    const data = await api("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name })
    });

    await loadCategories();
    return data.category;
  }

  async function handleUpdateCategory(categoryId, name) {
    const data = await api(`/api/categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify({ name })
    });

    await loadCategories();
    return data.category;
  }

  async function handleDeleteCategory(categoryId) {
    await api(`/api/categories/${categoryId}`, {
      method: "DELETE"
    });

    await loadCategories();
  }

  if (booting) {
    return <div className="boot-screen">Carregando sistema...</div>;
  }

  return (
    <div className="app-shell">
      <AppHeader user={user} onLogout={handleLogout} />

      <main className="page-frame">
        <Routes>
          <Route path="/" element={<GalleryPage api={api} categories={categories} />} />
          <Route
            path="/post/:postId"
            element={
              <PostDetailPage
                api={api}
                canComment={Boolean(user)}
                isAdmin={user?.role === "admin"}
                onMessage={notify}
              />
            }
          />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <AuthPage
                  mode="login"
                  title="Entrar na plataforma"
                  subtitle="Acesse sua conta para comentar casos."
                  onSubmit={handleLogin}
                  onMessage={notify}
                />
              )
            }
          />
          <Route
            path="/cadastro"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <AuthPage
                  mode="register"
                  title="Criar nova conta"
                  subtitle="Se cadastre para comentar imagens, estudar casos e acompanhar o acervo."
                  onSubmit={handleRegister}
                  onMessage={notify}
                />
              )
            }
          />
          <Route
            path="/recuperar-senha"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <ForgotPasswordPage
                  onSubmit={handlePasswordRecoveryRequest}
                  onMessage={notify}
                />
              )
            }
          />
          <Route
            path="/redefinir-senha"
            element={
              user ? (
                <Navigate to="/" replace />
              ) : (
                <ResetPasswordPage onSubmit={handlePasswordReset} onMessage={notify} />
              )
            }
          />
          <Route
            path="/admin/imagens"
            element={
              <AdminGuard user={user}>
                <ImageAdminPage
                  api={api}
                  categories={categories}
                  onSubmit={handleCreateImage}
                  onUpdate={handleUpdateImage}
                  onDelete={handleDeleteImage}
                  onMessage={notify}
                />
              </AdminGuard>
            }
          />
          <Route
            path="/admin/categorias"
            element={
              <AdminGuard user={user}>
                <CategoryAdminPage
                  categories={categories}
                  onImport={handleImportDataset}
                  onCreateCategory={handleCreateCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onMessage={notify}
                />
              </AdminGuard>
            }
          />
          <Route
            path="/admin/administradores"
            element={
              <AdminGuard user={user}>
                <AdminUsersPage
                  api={api}
                  currentUser={user}
                  onCreateAdmin={handleCreateAdmin}
                  onUpdateAdmin={handleUpdateAdmin}
                  onDeleteAdmin={handleDeleteAdmin}
                  onMessage={notify}
                />
              </AdminGuard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
