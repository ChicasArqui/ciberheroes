import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import Header from './components/Header.jsx';
import PipoScene from './components/PipoScene.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';
import GuardianProfilesPage from './pages/GuardianProfilesPage.jsx';

export default function App() {
  const [screen, setScreen] = useState(() => window.location.hash === '#guardian-profiles' ? 'guardian' : window.location.hash === '#roles' ? 'roles' : 'welcome');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      setNotice('');
      setScreen(window.location.hash === '#guardian-profiles' ? 'guardian' : window.location.hash === '#roles' ? 'roles' : 'welcome');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (next, hash) => {
    setNotice('');
    setScreen(next);
    window.history.pushState({ screen: next }, '', hash);
  };
  const showScopeNotice = (role) => {
    if (role === 'guardian') navigate('guardian', '#guardian-profiles');
    else setNotice('Has elegido el espacio de CiberHéroe. Esta pantalla se integrará en una tarea posterior.');
  };

  if (screen === 'guardian') return <GuardianProfilesPage onBack={() => navigate('roles', '#roles')} />;

  return (
    <div className="app-shell">
      <Header onAbout={() => setNotice('CiberHéroes es una experiencia educativa para niñas y niños de 8 a 13 años, acompañada por un adulto de confianza.')} onLogin={() => setNotice('El inicio de sesión se integrará cuando esté listo el backend.')} />
      <main className="main-content">
        <div className={`stage ${screen === 'welcome' ? 'welcome-stage' : 'roles-stage'}`}>
          <section className="content" aria-live="polite">
            {screen === 'welcome'
              ? <WelcomePage onStart={() => navigate('roles', '#roles')} onLogin={() => setNotice('El inicio de sesión se integrará cuando esté listo el backend.')} />
              : <RoleSelectionPage onBack={() => navigate('welcome', '#inicio')} onRole={showScopeNotice} />}
            {notice && <div className="scope-notice" role="status"><Info size={19} /><p>{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={17} /></button></div>}
          </section>
          <PipoScene welcome={screen === 'welcome'} />
        </div>
      </main>
      <footer className="site-footer"><span>Pequeños pasos. Grandes superpoderes.</span><span className="prototype-label"><i /> Experiencia inicial</span><span className="footer-note">Aprender también es cuidarnos.</span></footer>
    </div>
  );
}
