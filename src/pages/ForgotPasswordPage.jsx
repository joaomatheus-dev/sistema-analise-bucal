import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function ForgotPasswordPage({ onSubmit, onMessage }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await onSubmit(email);
      setResult(data);
      onMessage({
        text: "Recuperação iniciada. Use o link gerado abaixo para redefinir a senha.",
        type: "success"
      });
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <article className="spotlight-card">
        <p className="eyebrow">Acesso seguro</p>
        <h2>Recuperar senha</h2>
        <p>
          Informe o e-mail cadastrado. O sistema vai gerar um link interno de redefinição
          válido por 30 minutos.
        </p>
      </article>

      <article className="form-card stack">
        <form className="stack" onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="E-mail cadastrado"
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Gerando..." : "Gerar link de recuperação"}
          </button>
        </form>

        {result ? (
          <div className="recovery-box">
            <p className="muted-text">Link de redefinição gerado para este ambiente:</p>
            <Link className="text-link break-link" to={result.recoveryUrl}>
              {`${window.location.origin}${result.recoveryUrl}`}
            </Link>
            <p className="muted-text">
              Expira em {new Date(result.expiresAt).toLocaleString("pt-BR")}.
            </p>
          </div>
        ) : null}

        <button className="secondary" type="button" onClick={() => navigate("/login")}>
          Voltar para login
        </button>
      </article>
    </section>
  );
}

export default ForgotPasswordPage;
