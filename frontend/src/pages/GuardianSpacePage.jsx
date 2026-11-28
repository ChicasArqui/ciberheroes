import { useCallback, useEffect, useState } from 'react';
import { Copy, LogOut, Plus, RefreshCw, ShieldCheck, UsersRound, Pencil, Check, X } from 'lucide-react';
import { createChildProfile, getChildProfiles, getGuardianFamily, logoutGuardian, updateChildProfile } from '../services/api.js';
import './GuardianSpacePage.css';

const AVATARS = [
  { id: 'zorro', label: 'Zorro', emoji: '🦊' }, { id: 'gato', label: 'Gato', emoji: '🐱' },
  { id: 'perro', label: 'Perro', emoji: '🐶' }, { id: 'conejo', label: 'Conejo', emoji: '🐰' },
  { id: 'pinguino', label: 'Pingüino', emoji: '🐧' }, { id: 'buho', label: 'Búho', emoji: '🦉' },
  { id: 'mapache', label: 'Mapache', emoji: '🦝' }, { id: 'koala', label: 'Koala', emoji: '🐨' },
  { id: 'leon', label: 'León', emoji: '🦁' },
];
const avatarFor = (id) => AVATARS.find((avatar) => avatar.id === id) || AVATARS[0];

function ProfileForm({ initialProfile, onCancel, onSave, isSaving }) {
  const [nickname, setNickname] = useState(initialProfile?.nickname || '');
  const [avatarId, setAvatarId] = useState(initialProfile?.avatarId || 'zorro');
  const [temporaryPin, setTemporaryPin] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      setError('El apodo debe tener entre 2 y 20 caracteres.'); return;
    }
    if (!initialProfile && !/^\d{6}$/.test(temporaryPin)) {
      setError('El PIN temporal debe tener exactamente 6 números.'); return;
    }
    try {
      await onSave({ nickname: nickname.trim(), avatarId, ...(!initialProfile ? { temporaryPin } : {}) });
    } catch (saveError) {
      const messages = {
        INVALID_NICKNAME: 'El apodo debe tener entre 2 y 20 caracteres.',
        INVALID_AVATAR: 'Selecciona uno de los avatares disponibles.',
        INVALID_TEMPORARY_PIN: 'El PIN temporal debe tener 6 números.',
        FAMILY_NOT_FOUND: 'No encontramos tu familia. Vuelve a iniciar sesión.',
      };
      setError(messages[saveError.code] || 'No pudimos guardar el perfil. Inténtalo otra vez.');
    }
  }

  return (
    <form className="cib20-form" onSubmit={submit}>
      <div className="cib20-form-heading"><div><p className="cib20-eyebrow">{initialProfile ? 'EDITAR PERFIL' : 'NUEVO CIBERHÉROE'}</p><h2>{initialProfile ? 'Actualizar perfil' : 'Crear perfil infantil'}</h2></div>
        <button className="cib20-icon-button" type="button" onClick={onCancel} aria-label="Cerrar formulario"><X size={20} /></button>
      </div>
      <label className="cib20-label" htmlFor="child-nickname">Apodo del CiberHéroe</label>
      <input id="child-nickname" className="cib20-input" value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={2} maxLength={20} placeholder="Ej. Pipo" autoComplete="off" required />
      <span className="cib20-hint">Entre 2 y 20 caracteres. Evita usar el nombre completo del niño.</span>
      <span className="cib20-label">Elige su avatar</span>
      <div className="cib20-avatar-picker" role="group" aria-label="Avatares disponibles">
        {AVATARS.map((avatar) => <button className={`cib20-avatar-option${avatarId === avatar.id ? ' selected' : ''}`} key={avatar.id} type="button" onClick={() => setAvatarId(avatar.id)} aria-pressed={avatarId === avatar.id} aria-label={avatar.label}><span>{avatar.emoji}</span><small>{avatar.label}</small></button>)}
      </div>
      {!initialProfile && <>
        <label className="cib20-label" htmlFor="temporary-pin">PIN temporal de 6 números</label>
        <input id="temporary-pin" className="cib20-input cib20-pin-input" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" minLength={6} maxLength={6} value={temporaryPin} onChange={(event) => setTemporaryPin(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" required />
        <span className="cib20-hint">Entrégaselo al niño para su primer acceso. El sistema le pedirá crear un PIN nuevo.</span>
      </>}
      {error && <p className="cib20-error" role="alert">{error}</p>}
      <div className="cib20-form-actions"><button className="cib20-secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancelar</button><button className="cib20-primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : initialProfile ? 'Guardar cambios' : 'Crear perfil'} <Check size={18} /></button></div>
    </form>
  );
}

export default function GuardianSpacePage({ onLogin }) {
  const [familyCode, setFamilyCode] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [sessionStatus, setSessionStatus] = useState('checking');
  const [pageError, setPageError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const loadSpace = useCallback(async () => {
    setSessionStatus('checking'); setPageError('');
    try {
      const [family, result] = await Promise.all([getGuardianFamily(), getChildProfiles()]);
      setFamilyCode(family.familyCode); setProfiles(result.profiles || []); setSessionStatus('authenticated');
    } catch (error) {
      if (error.status === 401) { onLogin(); return; }
      setPageError(error.code === 'FAMILY_NOT_FOUND' ? 'Tu cuenta todavía no tiene una familia asociada.' : 'No pudimos cargar tu espacio familiar. Comprueba la conexión e inténtalo de nuevo.');
      setSessionStatus('error');
    }
  }, [onLogin]);
  useEffect(() => { loadSpace(); }, [loadSpace]);

  async function saveProfile(values) {
    setIsSaving(true);
    try {
      if (editingProfile) {
        const result = await updateChildProfile(editingProfile.id, { nickname: values.nickname, avatarId: values.avatarId });
        setProfiles((current) => current.map((profile) => profile.id === editingProfile.id ? result.profile : profile));
      } else {
        const result = await createChildProfile(values);
        setProfiles((current) => [...current, result.profile]);
      }
      setShowForm(false); setEditingProfile(null);
    } finally { setIsSaving(false); }
  }
  async function copyFamilyCode() {
    try { await navigator.clipboard.writeText(familyCode); setCopyMessage('Código copiado'); }
    catch { setCopyMessage(`Tu código familiar es: ${familyCode}`); }
  }
  async function handleLogout() {
    setIsLoggingOut(true);
    try { await logoutGuardian(); onLogin(); }
    catch { setPageError('No se pudo cerrar la sesión. Inténtalo de nuevo.'); setIsLoggingOut(false); }
  }

  if (sessionStatus === 'checking') return <main className="guardian-space-placeholder guardian-space-status"><p role="status">Preparando tu espacio familiar…</p></main>;
  if (sessionStatus === 'error') return <main className="guardian-space-placeholder guardian-space-status"><p role="alert">{pageError}</p><button className="cib20-primary-button" type="button" onClick={loadSpace}><RefreshCw size={17} /> Reintentar</button><button className="cib20-secondary-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>Cerrar sesión</button></main>;

  return (
    <main className="guardian-dashboard">
      <header className="guardian-dashboard-header">
        <div className="guardian-dashboard-brand"><ShieldCheck size={30} /><span>Ciber<span>Héroes</span></span></div>
        <div className="guardian-dashboard-actions"><span className="guardian-welcome-label">Espacio del Guardián</span><button className="cib20-secondary-button" type="button" onClick={handleLogout} disabled={isLoggingOut}><LogOut size={17} /> {isLoggingOut ? 'Cerrando…' : 'Cerrar sesión'}</button></div>
      </header>
      <section className="guardian-dashboard-intro"><p className="cib20-eyebrow">TU FAMILIA, TU EQUIPO</p><h1>¡Hola, Guardián!</h1><p>Administra los perfiles de tus CiberHéroes y acompáñalos a aprender de forma segura.</p></section>
      <section className="guardian-family-card" aria-label="Código familiar">
        <div className="guardian-family-icon"><UsersRound size={26} /></div>
        <div className="guardian-family-copy"><span>Tu código familiar</span><strong>{familyCode || 'No disponible'}</strong><small>Compártelo solo con las personas de confianza de tu familia.</small>{copyMessage && <small className="cib20-copy-message" role="status">{copyMessage}</small>}</div>
        <button className="cib20-secondary-button" type="button" onClick={copyFamilyCode} disabled={!familyCode}><Copy size={17} /> Copiar código</button>
      </section>
      <section className="guardian-profiles-section">
        <div className="guardian-section-heading"><div><p className="cib20-eyebrow">PERFILES INFANTILES</p><h2>Tu equipo de CiberHéroes</h2><p>Cada niño tiene su propio perfil y un acceso protegido.</p></div>
          {!showForm && <button className="cib20-primary-button" type="button" onClick={() => { setEditingProfile(null); setShowForm(true); }}><Plus size={19} /> Crear perfil</button>}
        </div>
        {pageError && <p className="cib20-error" role="alert">{pageError}</p>}
        {showForm && <ProfileForm initialProfile={editingProfile} onCancel={() => { setShowForm(false); setEditingProfile(null); }} onSave={saveProfile} isSaving={isSaving} />}
        {profiles.length === 0 && !showForm ? <div className="cib20-empty-state"><div className="cib20-empty-art">🛡️</div><h3>Tu equipo empieza aquí</h3><p>Aún no has creado perfiles infantiles. Añade el primero para que pueda comenzar su aventura.</p><button className="cib20-primary-button" type="button" onClick={() => setShowForm(true)}><Plus size={18} /> Crear primer perfil</button></div> : (
          <div className="cib20-profile-grid">{profiles.map((profile) => { const avatar = avatarFor(profile.avatarId); return <article className="cib20-profile-card" key={profile.id}><div className="cib20-profile-avatar" aria-hidden="true">{avatar.emoji}</div><div className="cib20-profile-info"><h3>{profile.nickname}</h3><span>{avatar.label}</span><small>{profile.mustChangePin ? 'Debe cambiar su PIN al ingresar' : 'Perfil listo para ingresar'}</small></div><button className="cib20-icon-button" type="button" onClick={() => { setEditingProfile(profile); setShowForm(true); }} aria-label={`Editar perfil de ${profile.nickname}`}><Pencil size={18} /></button></article>; })}</div>
        )}
      </section>
      <footer className="guardian-dashboard-footer"><span><ShieldCheck size={16} /> Los PIN se almacenan protegidos.</span><button type="button" onClick={loadSpace}><RefreshCw size={15} /> Actualizar perfiles</button></footer>
    </main>
  );
}
