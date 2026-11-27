import { Star } from 'lucide-react';

const scenes = new Map(Object.entries({
  welcome: {
    title: '¡Hola! Soy Pipo.',
    subtitle: '¿Exploramos juntos?',
    image: '/assets/pipo-saludo.png',
  },
  roles: {
    title: '¡Hay un lugar para ti!',
    subtitle: 'Elige cómo quieres entrar.',
    image: '/assets/pipo-saludo.png',
  },
  'guardian-register': {
    title: '¡Bienvenida, familia!',
    subtitle: 'Una gran aventura empieza contigo.',
    image: '/assets/pipo-bienvenida.png',
  },
  'guardian-login': {
    title: 'Aprendemos en equipo.',
    subtitle: 'Gracias por acompañar su aventura.',
    image: '/assets/pipo-saludo.png',
  },
  'guardian-success': {
    title: '¡Hacemos un gran equipo!',
    subtitle: 'Acompañar también es un superpoder.',
    image: '/assets/pipo-bienvenida.png',
  },
}));

export default function PipoScene({ scene = 'welcome' }) {
  const content = scenes.get(scene) ?? scenes.get('welcome');
  const isWelcome = scene === 'welcome';
  const isGuardianSuccess = scene === 'guardian-success';

  return (
    <aside className={`pipo-scene${isWelcome ? ' welcome' : ''}${isGuardianSuccess ? ' guardian-success-scene' : ''}`} aria-label="Pipo, tu compañero de aventuras">
      <div className="pipo-ground" />
      <div className="speech">{content.title}<small>{content.subtitle}</small></div>
      <Star className="scene-star" aria-hidden="true" />
      <Star className="scene-spark" aria-hidden="true" />
      <div className="pipo-shadow" />
      <img
        className="pipo-image"
        src={content.image}
        alt="Pipo, nuestra tortuga verde con su pañuelo morado y escudo"
        width={1254}
        height={1254}
        fetchpriority="high"
      />
      <span className="pipo-name">Tu compañero de aventuras</span>
    </aside>
  );
}
