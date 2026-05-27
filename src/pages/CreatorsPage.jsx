import cesmacLogo from "../assets/imagem-cesmac.png";
import { CITEC_TEAM, PSIC_TEAM } from "../constants/credits";

function CreatorsPage() {
  return (
    <section className="stack">
      <section className="hero-banner compact-hero">
        <div className="hero-banner-copy">
          <p className="hero-kicker">Informações</p>
          <h2>Quem somos</h2>
        </div>
      </section>

      <article className="form-card stack">
        <div className="stack compact">
          <h3>Equipe CITEC</h3>
          <div className="team-grid">
            {CITEC_TEAM.map((member) => (
              <div key={member.role} className="team-member-card">
                <span className="team-role">{member.role}</span>
                <strong>{member.name}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="stack compact section-divider">
          <h3>Equipe PSIC</h3>
          {PSIC_TEAM.length ? (
            <div className="team-grid">
              {PSIC_TEAM.map((member) => (
                <div key={member.role} className="team-member-card">
                  <span className="team-role">{member.role}</span>
                  <strong>{member.name}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-text">Espaço reservado para os nomes da equipe PSIC.</p>
          )}
        </div>

        <div className="logo-grid single-logo-grid section-divider">
          <img className="institution-logo" src={cesmacLogo} alt="Logo CESMAC" />
        </div>
      </article>
    </section>
  );
}

export default CreatorsPage;
