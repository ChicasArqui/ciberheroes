import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { getHealth } from './services/api.js';
import Header from './components/Header.jsx';
import PipoScene from './components/PipoScene.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';
import GuardianRegisterPage from './pages/GuardianRegisterPage.jsx';
import GuardianLoginPage from './pages/GuardianLoginPage.jsx';
import GuardianSpacePage from './pages/GuardianSpacePage.jsx';

function getScreenFromHash() {
  if (window.location.hash === '#roles') return 'roles';
  if (window.location.hash === '#guardian-register') return 'guardian-register';
  if (window.location.hash === '#guardian-login') return 'guardian-login';
  if (window.location.hash === '#guardian-space') return 'guardian-space';
  return 'welcome';
}
export default function App() {
  const [screen, setScreen] = useState(getScreenFromHash);
  const [pipoSceneOverride, setPipoSceneOverride] = useState('');
  const [notice, setNotice] = useState('');
  const [serviceStatus, setServiceStatus] = useState({
    server: 'checking',
    database: 'checking',
  });

  useEffect(() => {
    let active = true;
    getHealth()
      .then((health) => {
        if (active) setServiceStatus(health);
      })
      .catch(() => {
        if (active) setServiceStatus({ server: 'unavailable', database: 'unknown' });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setNotice('');
      setScreen(getScreenFromHash);
      setPipoSceneOverride('');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openRoleSelection = () => {
    setNotice('');
    setPipoSceneOverride('');
    setScreen('roles');
    window.history.pushState({ screen: 'roles' }, '', '#roles');
  };

  const goWelcome = () => {
    setNotice('');
    setPipoSceneOverride('');
    setScreen('welcome');
    window.history.pushState({ screen: 'welcome' }, '', '#inicio');
  };

  const openGuardianRegister = () => {
    setNotice('');
    setPipoSceneOverride('');
    setScreen('guardian-register');
    window.history.pushState(
      { screen: 'guardian-register' },
      '',
      '#guardian-register'
    );
  };

  const openGuardianLogin = () => {
    setNotice('');
    setPipoSceneOverride('');
    setScreen('guardian-login');
    window.history.pushState(
      { screen: 'guardian-login' },
      '',
      '#guardian-login'
    );
  };

  const openGuardianSpace = () => {
    setNotice('');
    setPipoSceneOverride('');
    setScreen('guardian-space');
    window.history.pushState(
      { screen: 'guardian-space' },
      '',
      '#guardian-space'
    );
  };

  const showScopeNotice = (role) => {
    if (role === 'guardian') {
      openGuardianRegister();
      return;
    }

    setNotice('El acceso de CiberHéroe se integrará en una tarea posterior.');
  };

  const showAbout = () => setNotice(
    'CiberHéroes es una experiencia educativa para niñas y niños de 8 a 13 años, acompañada por un adulto de confianza.'
  );

  if (screen === 'guardian-space') {
    return <GuardianSpacePage onLogin={openGuardianLogin} />;
  }

  return (
    <div className="app-shell">
      <Header onAbout={showAbout} onLogin={openGuardianLogin} />
      <main className="main-content">
        <div className={`stage ${screen === 'welcome' ? 'welcome-stage' : 'roles-stage'}`}>
          <section className="content" aria-live="polite">
            {screen === 'welcome' ? (
              <WelcomePage onStart={openRoleSelection} onLogin={openGuardianLogin} />
            ) : screen === 'roles' ? (
              <RoleSelectionPage onBack={goWelcome} onRole={showScopeNotice} />
            ) : screen === 'guardian-register' ? (
              <GuardianRegisterPage
                onLogin={openGuardianLogin}
                onGuardianSpace={openGuardianSpace}
                onRegistrationComplete={() => setPipoSceneOverride('guardian-success')}
              />
            ) : (
              <GuardianLoginPage
                onRegister={openGuardianRegister}
                onAuthenticated={openGuardianSpace}
              />
            )}
            {notice && (
              <div className="scope-notice" role="status">
                <Info size={19} aria-hidden="true" />
                <p>{notice}</p>
                <button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={17} /></button>
              </div>
            )}
          </section>
          <PipoScene scene={pipoSceneOverride || screen} />
        </div>
      </main>
      <footer className="site-footer">
        <span>Pequeños pasos. Grandes superpoderes.</span>
        <span className="service-status" aria-live="polite">
          API: {serviceStatus.server === 'running' ? 'conectada' : serviceStatus.server === 'checking' ? 'comprobando' : 'no disponible'}
          {' · '}
          MongoDB: {serviceStatus.database === 'connected' ? 'conectada' : serviceStatus.database === 'disconnected' ? 'desconectada' : 'sin verificar'}
        </span>
        <span className="prototype-label"><i /> Experiencia inicial</span>
        <span className="footer-note">Aprender también es cuidarnos.</span>
      </footer>
    </div>
  );
}
