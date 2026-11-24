import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import ChildAccess from './features/ChildAccess.jsx';
import Header from './components/Header.jsx';
import PipoScene from './components/PipoScene.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';

function getScreen() {
  switch (window.location.hash) {
    case '#roles': return 'roles';
    case '#familia': return 'family';
    default: return 'welcome';
  }
}

export default function App() {
  const [screen, setScreen] = useState(getScreen);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      setNotice('');
      setScreen(getScreen());
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

  const chooseRole = (role) => {
    if (role === 'hero') {
      setNotice('');
      setScreen('family');
      window.history.pushState({ screen: 'family', fromRoles: true }, '', '#familia');
      return;
    }

    setNotice('Has elegido el espacio de Guardián. La siguiente pantalla se integrará en una tarea posterior.');
  };

  const changeRole = () => {
    if (window.history.state?.fromRoles) {
      window.history.back();
      return;
    }
    setNotice('');
    setScreen('roles');
    window.history.replaceState({ screen: 'roles' }, '', '#roles');
  };

  const showAbout = () => setNotice('CiberHéroes es una experiencia educativa para niñas y niños de 8 a 13 años, acompañada por un adulto de confianza.');
  const showLoginScope = () => setNotice('El inicio de sesión se integrará cuando esté listo el backend. En esta entrega solo preparamos la bienvenida y la selección de rol.');

  if (screen === 'family') {
    return <ChildAccess onChangeRole={changeRole} />;
  }

  return (
    <div className="app-shell">
      <Header onAbout={showAbout} onLogin={showLoginScope} />
      <main className="main-content">
        <div className={`stage ${screen === 'welcome' ? 'welcome-stage' : 'roles-stage'}`}>
          <section className="content" aria-live="polite">
            {screen === 'welcome'
              ? <WelcomePage onStart={openRoleSelection} onLogin={showLoginScope} />
              : <RoleSelectionPage onBack={goWelcome} onRole={chooseRole} />}
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
