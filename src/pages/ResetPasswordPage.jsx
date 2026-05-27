import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function ResetPasswordPage({ onSubmit, onMessage }) {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (!token) {
        throw new Error("Token de recuperação não informado.");
      }

      if (password !== confirmPassword) {
        throw new Error("As senhas não conferem.");
      }

      await onSubmit({ token, password, confirmPassword });
      navigate("/login");
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
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
          <h2>Redefinir senha</h2>
          <p>{email ? `Conta selecionada: ${email}` : "Informe sua nova senha."}</p>
        </div>

        <form className="stack" onSubmit={handleSubmit}>
          <input value={token} readOnly placeholder="Token de recuperação" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Nova senha"
            required
          />
          <input
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            placeholder="Confirmar nova senha"
            required
          />
          <button className="primary-button full-width" type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            <Link to="/recuperar-senha">Gerar outro link de recuperação</Link>
          </p>
        </div>
      </article>
    </section>
  );
}

export default ResetPasswordPage;
