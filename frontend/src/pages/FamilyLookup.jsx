
import { useState } from 'react';
import { lookupFamily } from '../services/familyService';
import pipo from '../assets/pipo.jpeg';
import '../styles/ChildAccess.css';

export default function FamilyLookup({ onSuccess }) {
  const [familyCode, setFamilyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const code = familyCode.trim().toUpperCase();

    if (!code) {
      setError('Escribe el código de tu familia');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profiles = await lookupFamily(code);
      onSuccess(profiles);
    } catch {
      setError('No pudimos encontrar tu equipo. Revisa el código e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="child-access">
      <header className="child-header">
        <div className="child-brand">🛡️ Ciber<span>Héroes</span></div>
        <span>Para familias</span>
      </header>

      <div className="child-layout">
        <main className="child-content">
          <p className="child-back">← Cambiar de rol</p>

          <nav className="child-steps" aria-label="Progreso">
            <strong>1. Tu familia</strong>
            <span>›</span>
            <span>2. Tu perfil</span>
            <span>›</span>
            <span>3. Tu PIN</span>
          </nav>

          <h1>¡Busquemos<br />a tu equipo!</h1>

          <p className="child-description">
            Escribe el código de tu familia para encontrar
            tu perfil de CiberHéroe
          </p>

          <form onSubmit={handleSubmit} className="child-form">
            <label htmlFor="family-code">Código de tu familia</label>

            <input
              id="family-code"
              value={familyCode}
              onChange={(event) => setFamilyCode(event.target.value)}
              placeholder="Escribe tu código"
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'family-error' : undefined}
            />

            {error && (
              <p id="family-error" role="alert" className="child-error">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? 'Buscando...' : 'Encontrar mi perfil →'}
            </button>
          </form>

          <div className="child-help">
            <strong>ⓘ ¿Dónde encuentro mi código?</strong>
            <p>
              Pídeselo a tu Guardián. Si estás en clase,
              tu profe puede ayudarte
            </p>
          </div>
        </main>

        <aside className="child-illustration">
          <div className="child-pipo-background">
            <img src={pipo} alt="Pipo, la mascota de CiberHéroes" />
          </div>

          <div className="child-speech">
            <strong>Vamos paso a paso.</strong>
            <p>Tu Guardián tiene el código.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
