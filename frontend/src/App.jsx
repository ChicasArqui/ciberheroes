import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import Header from './components/Header.jsx';
import PipoScene from './components/PipoScene.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';
import GuardianRegisterPage from './pages/GuardianRegisterPage.jsx';

function getScreenFromHash() {
    if (window.location.hash === '#roles') return 'roles';
    if (window.location.hash === '#guardian-register') return 'guardian-register';
    return 'welcome';
}
export default function App() {
  const [screen, setScreen] = useState(getScreenFromHash);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      setNotice('');
      setScreen(getScreenFromHash);
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
  if (role === 'guardian') {
    setNotice('');
    setScreen('guardian-register');
    window.history.pushState({ screen: 'guardian-register' }, '', '#guardian-register');
    return;
  }

  setNotice('El acceso de CiberHéroe se integrará en una tarea posterior.');
};

  const showAbout = () => setNotice('CiberHéroes es una experiencia educativa para niñas y niños de 8 a 13 años, acompañada por un adulto de confianza.');
  const showLoginScope = () => setNotice('El inicio de sesión se integrará cuando esté listo el backend. En esta entrega solo preparamos la bienvenida y la selección de rol.');

  return (
    <div className="app-shell">
      <Header onAbout={showAbout} onLogin={showLoginScope} />
      <main className="main-content">
        <div className={`stage ${screen === 'welcome' ? 'welcome-stage' : 'roles-stage'}`}>
          <section className="content" aria-live="polite">
            {screen === 'welcome' ? (
              <WelcomePage onStart={openRoleSelection} onLogin={showLoginScope} />
            ) : screen === 'roles' ? (
              <RoleSelectionPage onBack={goWelcome} onRole={showScopeNotice} />
            ) : (
              <GuardianRegisterPage />
            )}
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
