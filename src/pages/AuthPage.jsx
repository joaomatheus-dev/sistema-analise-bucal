import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { emptyRegister } from "../constants/forms";

function AuthPage({ mode, title, subtitle, onSubmit, onMessage }) {
  const [form, setForm] = useState(
    mode === "login" ? { email: "", password: "" } : emptyRegister
  );
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "register" && form.password !== form.confirmPassword) {
        throw new Error("As senhas não conferem.");
      }

      await onSubmit(form);
    } catch (error) {
      onMessage?.({ text: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <article className="spotlight-card">
        <p className="eyebrow">Acesso</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </article>

      <article className="form-card">
        <form className="stack" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome completo"
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
            </>
          ) : null}

          <input
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            type="email"
            placeholder="E-mail"
            required
          />
          <input
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            type="password"
            placeholder="Senha"
            required
          />

          {mode === "register" ? (
            <input
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              type="password"
              placeholder="Confirmar senha"
              required
            />
          ) : null}

          <button type="submit" disabled={submitting}>
            {submitting ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        {mode === "login" ? (
          <Link className="text-link" to="/recuperar-senha">
            Esqueci minha senha
          </Link>
        ) : null}

        <button className="secondary" type="button" onClick={() => navigate("/")}>
          Voltar para a biblioteca
        </button>
      </article>
    </section>
  );
}

export default AuthPage;
