import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import Header from './components/Header.jsx';
import PipoScene from './components/PipoScene.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';

export default function App() {
  const [screen, setScreen] = useState(window.location.hash === '#roles' ? 'roles' : 'welcome');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      setNotice('');
      setScreen(window.location.hash === '#roles' ? 'roles' : 'welcome');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openRoleSelection = () => {
    setNotice('');
    setScreen('roles');
    window.history.pushState({ screen: 'roles' }, '', '#roles');
  };

  const goWelcome = () => {
    setNotice('');
    setScreen('welcome');
    window.history.pushState({ screen: 'welcome' }, '', '#inicio');
  };

  const showScopeNotice = (role) => {
    const roleName = role === 'hero' ? 'CiberHéroe' : 'Guardián';
    setNotice(`Has elegido el espacio de ${roleName}. La siguiente pantalla se integrará en una tarea posterior.`);
  };

  const showAbout = () => setNotice('CiberHéroes es una experiencia educativa para niñas y niños de 8 a 13 años, acompañada por un adulto de confianza.');
  const showLoginScope = () => setNotice('El inicio de sesión se integrará cuando esté listo el backend. En esta entrega solo preparamos la bienvenida y la selección de rol.');

  return (
    <div className="app-shell">
      <Header onAbout={showAbout} onLogin={showLoginScope} />
      <main className="main-content">
        <div className={`stage ${screen === 'welcome' ? 'welcome-stage' : 'roles-stage'}`}>
          <section className="content" aria-live="polite">
            {screen === 'welcome'
              ? <WelcomePage onStart={openRoleSelection} onLogin={showLoginScope} />
              : <RoleSelectionPage onBack={goWelcome} onRole={showScopeNotice} />}
            {notice && (
              <div className="scope-notice" role="status">
                <Info size={19} aria-hidden="true" />
                <p>{notice}</p>
                <button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={17} /></button>
              </div>
            )}
          </section>
          <PipoScene welcome={screen === 'welcome'} />
        </div>
      </main>
      <footer className="site-footer">
        <span>Pequeños pasos. Grandes superpoderes.</span>
        <span className="prototype-label"><i /> Experiencia inicial</span>
        <span className="footer-note">Aprender también es cuidarnos.</span>
      </footer>
    </div>
  );
}
