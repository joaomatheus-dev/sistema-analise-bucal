import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPasswordPage({ onSubmit, onMessage }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await onSubmit(email);
      setResult(data);
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <section className="auth-screen">
        <div className="auth-hero">
          <div className="auth-logo-mark">IO</div>
          <div className="auth-wordmark">
            Img<span>Odonto</span>
          </div>
          <span className="brand-underline auth-logo-underline" />
        </div>

        <article className="auth-card confirmation-card">
          <div className="confirmation-icon">✓</div>
          <div className="auth-card-heading">
            <h2>Email de confirmação enviado</h2>
            <p>Verifique seu email e siga as instruções. Veja também o spam.</p>
          </div>
          <Link className="primary-button full-width link-button" to={result.recoveryUrl}>
            Abrir email
          </Link>
        </article>
      </section>
    );
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
          <h2>Recuperar senha</h2>
          <p>Informe o email cadastrado para continuar.</p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email"
            required
          />
          <button className="primary-button full-width" type="submit" disabled={submitting}>
            {submitting ? "Gerando..." : "Enviar confirmação"}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            Lembrou sua senha? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </article>
    </section>
  );
}

export default ForgotPasswordPage;
