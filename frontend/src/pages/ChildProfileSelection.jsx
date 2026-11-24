import pipo from '../assets/pipo.jpeg';
import '../styles/ChildAccess.css';
import './ChildProfileSelection.css';

const avatarIcons = new Map([['tortuga-01', '🐢']]);

export default function ChildProfileSelection({
  profiles,
  selectedProfile,
  onSelect,
  onBack
}) {
  return (
    <div className="child-access">
      <header className="child-header">
        <div className="child-brand">
          🛡️ Ciber<span>Héroes</span>
        </div>
        <span>Para familias</span>
      </header>

      <div className="child-layout">
        <main className="child-content">
          <button
            type="button"
            className="child-back-button"
            onClick={onBack}
          >
            ← Cambiar de familia
          </button>

          <nav className="child-steps" aria-label="Progreso">
            <span>1. Tu familia</span>
            <span>›</span>
            <strong>2. Tu perfil</strong>
            <span>›</span>
            <span>3. Tu PIN</span>
          </nav>

          <h1>¡Hola, CiberHéroe!<br />¿Cuál eres tú?</h1>

          <p className="child-description">
            Busca tu apodo y elige tu perfil para continuar.
          </p>

          {profiles.length === 0 ? (
            <p role="status">
              Todavía no hay perfiles disponibles.
            </p>
          ) : (
            <div className="child-profile-grid">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className="child-profile-card"
                  aria-pressed={selectedProfile?.id === profile.id}
                  onClick={() => onSelect(profile)}
                >
                  <span className="child-profile-avatar" aria-hidden="true">
                    {avatarIcons.get(profile.avatarId) ?? '🦸'}
                  </span>
                  <span>{profile.nickname}</span>
                </button>
              ))}
            </div>
          )}

          {selectedProfile && (
            <p role="status">
              Perfil seleccionado: {selectedProfile.nickname}. El paso de PIN se habilitará más adelante.
            </p>
          )}
        </main>

        <aside className="child-illustration">
          <div className="child-pipo-background">
            <img
              src={pipo}
              alt="Pipo, la mascota de CiberHéroes"
            />
          </div>

          <div className="child-speech">
            <strong>¡Encontramos tu equipo!</strong>
            <p>¿Cuál de estos héroes eres tú?</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
