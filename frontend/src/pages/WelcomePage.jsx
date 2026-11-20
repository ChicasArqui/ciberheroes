import { ArrowRight, ShieldCheck, UsersRound } from 'lucide-react';

export default function WelcomePage({ onStart, onLogin }) {
  return (
    <div className="welcome-copy">
      <p className="eyebrow"><span /> UNA AVENTURA DIGITAL SEGURA</p>
      <h1 className="welcome-title">Tu próxima<br /><span>aventura</span><br />empieza aquí.</h1>
      <p className="intro">Aprende a cuidarte en Internet, supera retos y descubre tus superpoderes junto a Pipo.</p>
      <div className="welcome-actions">
        <button className="button button-primary" type="button" onClick={onStart}>¡Quiero empezar! <ArrowRight size={20} /></button>
        <button className="button button-secondary" type="button" onClick={onLogin}>Ya tengo cuenta</button>
      </div>
      <p className="welcome-note"><UsersRound size={17} /> Las cuentas las crea un adulto de confianza.</p>
      <div className="trust-line">
        <span className="trust-icon"><ShieldCheck size={21} /></span>
        <p><strong>Aprender, jugar y crecer.</strong><br />Una aventura para niños de 8 a 13 años.</p>
      </div>
    </div>
  );
}
