import { Star } from 'lucide-react';

export default function PipoScene({ welcome = false }) {
  return (
    <aside className={`pipo-scene${welcome ? ' welcome' : ''}`} aria-label="Pipo, tu compañero de aventuras">
      <div className="pipo-ground" />
      <div className="speech">¡Hola! Soy Pipo.<small>¿Exploramos juntos?</small></div>
      <Star className="scene-star" aria-hidden="true" />
      <Star className="scene-spark" aria-hidden="true" />
      <div className="pipo-shadow" />
      <img
        className="pipo-image"
        src={welcome ? "/assets/pipo-saludo.png" : "/assets/pipo-bienvenida.svg"}
        alt="Pipo, nuestra tortuga verde con su pañuelo azul y escudo"
        width={welcome ? 1254 : 600}
        height={welcome ? 1254 : 650}
        fetchPriority="high"
      />
      <span className="pipo-name">Tu compañero de aventuras</span>
    </aside>
  );
}
