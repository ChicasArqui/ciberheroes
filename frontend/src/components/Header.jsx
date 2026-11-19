import Brand from './Brand.jsx';

export default function Header({ onAbout, onLogin }) {
  return (
    <header className="site-header">
      <Brand />
      <nav className="header-nav" aria-label="Navegación principal">
        <button className="nav-link" type="button" onClick={onAbout}>Para familias</button>
        <button className="nav-login" type="button" onClick={onLogin}>Iniciar sesión <span aria-hidden="true">↗</span></button>
      </nav>
    </header>
  );
}
