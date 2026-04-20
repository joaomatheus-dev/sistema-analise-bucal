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
      onMessage({ text: "Senha redefinida com sucesso. Faça login com a nova senha.", type: "success" });
      navigate("/login");
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <article className="spotlight-card">
        <p className="eyebrow">Nova senha</p>
        <h2>Redefinir senha</h2>
        <p>
          {email ? `Conta selecionada: ${email}.` : "Informe a nova senha para concluir a recuperação."}
        </p>
      </article>

      <article className="form-card stack">
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
          <button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <Link className="text-link" to="/recuperar-senha">
          Gerar outro link de recuperação
        </Link>
      </article>
    </section>
  );
}

export default ResetPasswordPage;
