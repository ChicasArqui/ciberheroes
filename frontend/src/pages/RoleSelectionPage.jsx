import { ArrowLeft } from 'lucide-react';
import RoleCard from '../components/RoleCard.jsx';

export default function RoleSelectionPage({ onBack, onRole }) {
  return (
    <div className="role-copy-page">
      <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> Volver</button>
      <p className="eyebrow"><span /> QUÉ BUENO TENERTE AQUÍ</p>
      <h1 className="form-title">¿Quién se une<br />a la aventura?</h1>
      <p className="form-intro">Elige tu espacio. Pipo te acompaña en cada paso.</p>
      <div className="role-options">
        <RoleCard type="hero" title="Soy CiberHéroe" description="Quiero aprender y jugar con Pipo." onClick={() => onRole('hero')} />
        <RoleCard type="guardian" title="Soy Guardián" description="Soy mamá, papá, tutor o docente." onClick={() => onRole('guardian')} />
      </div>
      <p className="minor-note">Cada héroe tiene su espacio. Cada Guardián, una aventura que acompañar.</p>
    </div>
  );
}
