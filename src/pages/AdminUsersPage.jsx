import { useEffect, useState } from "react";
import { emptyAdminRegister } from "../constants/forms";

function AdminUsersPage({ api, currentUser, onCreateAdmin, onUpdateAdmin, onDeleteAdmin, onMessage }) {
  const [form, setForm] = useState(emptyAdminRegister);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(emptyAdminRegister);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function loadAdmins() {
    setLoadingAdmins(true);

    try {
      const data = await api("/api/admins");
      setAdmins(data);
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setLoadingAdmins(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (form.password !== form.confirmPassword) {
        throw new Error("As senhas nao conferem.");
      }

      await onCreateAdmin(form);
      setForm(emptyAdminRegister);
      await loadAdmins();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    setSavingEdit(true);

    try {
      if (editingForm.password || editingForm.confirmPassword) {
        if (editingForm.password !== editingForm.confirmPassword) {
          throw new Error("As senhas não conferem.");
        }
      }

      await onUpdateAdmin(editingId, editingForm);
      setEditingId(null);
      setEditingForm(emptyAdminRegister);
      await loadAdmins();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(admin) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o administrador "${admin.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(admin.id);

    try {
      await onDeleteAdmin(admin.id);
      await loadAdmins();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="admin-layout">
      <article className="spotlight-card">
        <p className="eyebrow">Gestao de acesso</p>
        <h2>Cadastrar outro administrador</h2>
        <p>
          Crie novos usuarios com permissao administrativa para moderacao, cadastro de imagens
          e gestao de categorias.
        </p>
      </article>

      <article className="form-card wide">
        <form className="stack" onSubmit={handleSubmit}>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nome completo"
            required
          />
          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            type="email"
            placeholder="E-mail"
            required
          />
          <input
            value={form.university}
            onChange={(event) =>
              setForm((current) => ({ ...current, university: event.target.value }))
            }
            placeholder="Universidade"
            required
          />
          <input
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            type="password"
            placeholder="Senha"
            required
          />
          <input
            value={form.confirmPassword}
            onChange={(event) =>
              setForm((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            type="password"
            placeholder="Confirmar senha"
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Cadastrando..." : "Cadastrar administrador"}
          </button>
        </form>

        <div className="stack compact section-divider">
          <h3>Administradores atuais</h3>
          {loadingAdmins ? <p>Carregando administradores...</p> : null}
          {!loadingAdmins && admins.length === 0 ? <p>Nenhum administrador encontrado.</p> : null}
          <div className="category-list">
            {admins.map((admin) => (
              <div key={admin.id} className="category-row">
                {editingId === admin.id ? (
                  <form className="stack admin-edit-form" onSubmit={handleEditSubmit}>
                    <input
                      value={editingForm.name}
                      onChange={(event) =>
                        setEditingForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Nome completo"
                      required
                    />
                    <input
                      value={editingForm.email}
                      onChange={(event) =>
                        setEditingForm((current) => ({ ...current, email: event.target.value }))
                      }
                      type="email"
                      placeholder="E-mail"
                      required
                    />
                    <input
                      value={editingForm.university}
                      onChange={(event) =>
                        setEditingForm((current) => ({
                          ...current,
                          university: event.target.value
                        }))
                      }
                      placeholder="Universidade"
                      required
                    />
                    <input
                      value={editingForm.password}
                      onChange={(event) =>
                        setEditingForm((current) => ({ ...current, password: event.target.value }))
                      }
                      type="password"
                      placeholder="Nova senha opcional"
                    />
                    <input
                      value={editingForm.confirmPassword}
                      onChange={(event) =>
                        setEditingForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value
                        }))
                      }
                      type="password"
                      placeholder="Confirmar nova senha"
                    />
                    <div className="inline-actions">
                      <button type="submit" disabled={savingEdit}>
                        {savingEdit ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingForm(emptyAdminRegister);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="stack compact">
                      <strong>{admin.name}</strong>
                      <span className="muted-text">{admin.email}</span>
                      <span className="muted-text">{admin.university}</span>
                    </div>
                    <div className="inline-actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(admin.id);
                          setEditingForm({
                            name: admin.name,
                            email: admin.email,
                            university: admin.university,
                            password: "",
                            confirmPassword: ""
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => handleDelete(admin)}
                        disabled={deletingId === admin.id || Number(currentUser?.id) === Number(admin.id)}
                      >
                        {deletingId === admin.id
                          ? "Excluindo..."
                          : Number(currentUser?.id) === Number(admin.id)
                            ? "Usuário atual"
                            : "Excluir"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}

export default AdminUsersPage;
