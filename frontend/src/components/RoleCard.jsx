import { ArrowUpRight, ShieldCheck, UsersRound } from 'lucide-react';

const roleIcons = {
  hero: ShieldCheck,
  guardian: UsersRound,
};

export default function RoleCard({ type, title, description, onClick }) {
  const Icon = roleIcons[type];
  return (
    <button className={`role-card ${type}`} type="button" onClick={onClick}>
      <span className="role-art"><Icon size={31} strokeWidth={2.1} /></span>
      <span className="role-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <ArrowUpRight className="role-arrow" size={21} aria-hidden="true" />
    </button>
  );
}
