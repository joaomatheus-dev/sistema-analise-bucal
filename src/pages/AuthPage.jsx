import { useState } from "react";
import { Link } from "react-router-dom";
import { emptyRegister } from "../constants/forms";
import { ALAGOAS_UNIVERSITIES, OTHER_UNIVERSITY_VALUE } from "../constants/universities";

function AuthPage({ mode, title, subtitle, onSubmit, onMessage }) {
  const [form, setForm] = useState(
    mode === "login" ? { email: "", password: "" } : emptyRegister
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const resolvedUniversity =
        mode === "register"
          ? form.university === OTHER_UNIVERSITY_VALUE
            ? form.customUniversity.trim()
            : form.university.trim()
          : "";

      if (mode === "register" && form.password !== form.confirmPassword) {
        throw new Error("As senhas não conferem.");
      }

      if (mode === "register" && !resolvedUniversity) {
        throw new Error("Selecione uma universidade ou informe manualmente.");
      }

      const payload =
        mode === "register"
          ? {
              name: form.name.trim(),
              email: form.email.trim(),
              university: resolvedUniversity,
              password: form.password,
              confirmPassword: form.confirmPassword
            }
          : {
              email: form.email.trim(),
              password: form.password
            };

      await onSubmit(payload);
    } catch (error) {
      onMessage?.({ text: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-screen">
      <div className="auth-hero">
        <div className="auth-logo-mark">IO</div>
        <div className="auth-wordmark">
          Img<span>Odonto</span>
        </div>
        <span className="brand-underline auth-logo-underline" />
      </div>

      <article className="auth-card">
        <div className="auth-card-heading">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome completo"
                required
              />
              <select
                value={form.university}
                onChange={(event) =>
                  setForm((current) => ({ ...current, university: event.target.value }))
                }
                required
              >
                <option value="">Selecione sua universidade</option>
                {ALAGOAS_UNIVERSITIES.map((university) => (
                  <option key={university} value={university}>
                    {university}
                  </option>
                ))}
                <option value={OTHER_UNIVERSITY_VALUE}>Outra universidade</option>
              </select>
              {form.university === OTHER_UNIVERSITY_VALUE ? (
                <input
                  value={form.customUniversity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customUniversity: event.target.value
                    }))
                  }
                  placeholder="Digite o nome da sua universidade"
                  required
                />
              ) : null}
              <p className="field-hint">
                Lista com universidades conhecidas de Alagoas. Se a sua não estiver aqui, escolha
                a opção manual.
              </p>
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

          {mode === "login" ? (
            <Link className="auth-inline-link" to="/recuperar-senha">
              Esqueci minha senha
            </Link>
          ) : null}

          <button className="primary-button full-width" type="submit" disabled={submitting}>
            {submitting ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="auth-footer-links">
          {mode === "login" ? (
            <p>
              Não tem cadastro? <Link to="/cadastro">Crie uma conta</Link>
            </p>
          ) : (
            <p>
              Já possui conta? <Link to="/login">Entrar</Link>
            </p>
          )}
        </div>
      </article>
    </section>
  );
}

export default AuthPage;
