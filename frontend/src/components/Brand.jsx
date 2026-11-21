import { ShieldCheck } from 'lucide-react';

export default function Brand() {
  return (
    <a className="brand" href="#inicio" aria-label="CiberHéroes, inicio">
      <span className="brand-mark" aria-hidden="true"><ShieldCheck size={25} strokeWidth={2.5} /></span>
      <span>Ciber<span>Héroes</span><i>.</i></span>
    </a>
  );
}
