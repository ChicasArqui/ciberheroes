
import { useState } from 'react';
import './App.css';

const modules = [
  { id: 1, title: 'Identificar Extraños', icon: '🕵️' },
  { id: 2, title: 'Regalos Falsos', icon: '🎁' },
  { id: 3, title: 'Secretos y Límites', icon: '🛡️' },
  { id: 4, title: 'Ciber Escudo Pro', icon: '🏆' },
];

const achievements = [
  { icon: '🛡️', name: 'Ciber-Escudo' },
  { icon: '🔒', name: 'Guardián' },
  { icon: '❤️', name: 'Confianza' },
  { icon: '⭐', name: 'Antitrampas' },
];

function App() {
  const [selectedModule, setSelectedModule] = useState(null);

  return (
    <main className="game-screen">
      <header className="header">
        <nav className="nav-tabs">
          <button onClick={() => setSelectedModule(null)}>🏠 INICIO</button>
          <button onClick={() => setSelectedModule(modules[0])}>📖 LECCIONES</button>
          <button disabled>🛍️ TIENDA</button>
          <button disabled>🏆 LOGROS</button>
          <button disabled>👤 PERFIL</button>
        </nav>

        <div className="brand">
          <h1>CIBERHÉROES</h1>
          <p>🛡️ Protegiéndonos en Internet</p>
        </div>

        <div className="stats">
          <span>🔥 Racha: 1</span>
          <span>💎 Gemas: 230</span>
        </div>
      </header>

      {selectedModule ? (
        <section className="module-detail">
          <button className="back-button" onClick={() => setSelectedModule(null)}>
            ← Volver al mapa
          </button>
          <h2>{selectedModule.icon} {selectedModule.title}</h2>
          <p>Selecciona un nivel para comenzar tu misión.</p>
          <div className="levels">
            {[1, 2, 3, 4, 5].map((level) => (
              <div className="level-card" key={level}>
                <span>⭐</span>
                <h3>Nivel {level}</h3>
                <p>Próximamente</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="map-section">
            <h2>🌟 Tu aventura comienza aquí</h2>
            <div className="module-map">
              {modules.map((module) => (
                <button
                  className="module-node"
                  key={module.id}
                  onClick={() => setSelectedModule(module)}
                >
                  <span className="module-icon">{module.icon}</span>
                  <strong>MÓDULO {module.id}</strong>
                  <small>{module.title}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="bottom-grid">
            <div className="panel">
              <h2>🏆 LOGROS DESBLOQUEADOS</h2>
              <div className="achievements">
                {achievements.map((achievement, index) => (
                  <div className={`achievement ${index === 0 ? 'unlocked' : ''}`} key={achievement.name}>
                    <span>{achievement.icon}</span>
                    <small>{achievement.name}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <h2>🦸 MI AVATAR</h2>
              <div className="avatar-content">
                <div className="avatar">🧑‍🎤</div>
                <div>
                  <p>Personaliza tu héroe y consigue accesorios con tus gemas.</p>
                  <button className="store-button" disabled>🛍️ Tienda próximamente</button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default App;
