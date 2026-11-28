import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, LogOut, Plus, RefreshCw, ShieldCheck, UsersRound, Pencil, X, LockKeyhole, Sparkles, Trash2 } from 'lucide-react';
import { createChildProfile, getChildProfiles, getGuardianFamily, logoutGuardian, updateChildProfile, deleteChildProfile } from '../services/api.js';
import './GuardianSpacePage.css';

const AVATARS = [
  { id: 'zorro', label: 'Zorro', emoji: '🦊', tone: 'lilac' },
  { id: 'gato', label: 'Gato', emoji: '🐱', tone: 'pink' },
  { id: 'perro', label: 'Perro', emoji: '🐶', tone: 'blue' },
  { id: 'conejo', label: 'Conejo', emoji: '🐰', tone: 'mint' },
  { id: 'pinguino', label: 'Pingüino', emoji: '🐧', tone: 'blue' },
  { id: 'buho', label: 'Búho', emoji: '🦉', tone: 'yellow' },
  { id: 'mapache', label: 'Mapache', emoji: '🦝', tone: 'lilac' },
  { id: 'koala', label: 'Koala', emoji: '🐨', tone: 'mint' },
  { id: 'leon', label: 'León', emoji: '🦁', tone: 'yellow' },
];
const avatarFor = (id) => AVATARS.find((avatar) => avatar.id === id) || AVATARS[0];

function ProfileForm({ initialProfile, onCancel, onSave, isSaving }) {
  const [nickname, setNickname] = useState(initialProfile?.nickname || '');
  const [avatarId, setAvatarId] = useState(initialProfile?.avatarId || 'zorro');
  const [temporaryPin, setTemporaryPin] = useState('');
  const [showPin, setShowPin] = useState(false);
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

  const selected = avatarFor(avatarId);
  return (
    <section className="cib20-editor">
      <button className="cib20-back-link" type="button" onClick={onCancel}><ArrowLeft size={17} /> Volver a perfiles</button>
      <div className="cib20-editor-heading">
        <div><p className="cib20-eyebrow">{initialProfile ? 'PORTAL DEL GUARDIÁN' : 'NUEVO PERFIL INFANTIL'}</p>
          <h1>{initialProfile ? 'Editar CiberHéroe' : 'Crear CiberHéroe'}</h1>
          <p>{initialProfile ? 'Actualiza el apodo y el avatar de este perfil.' : 'Completa la información para añadir un nuevo perfil a tu equipo.'}</p>
        </div>
        <div className="cib20-editor-mascot" aria-hidden="true">🐢<span>✦</span></div>
      </div>
      <form className="cib20-editor-card" onSubmit={submit}>
        <div className="cib20-editor-fields">
          <label className="cib20-label" htmlFor="child-nickname">Apodo</label>
          <input id="child-nickname" className="cib20-input" value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={2} maxLength={20} placeholder="Escribe un apodo (ej. Valentina)" autoComplete="off" required />
          <span className="cib20-hint">Usa un apodo de entre 2 y 20 caracteres. Evita el nombre completo del niño.</span>
        </div>
        <div className="cib20-avatar-section">
          <span className="cib20-label">Elige un avatar</span>
          <p className="cib20-hint">Selecciona el personaje que más te guste.</p>
          <div className="cib20-avatar-picker" role="group" aria-label="Avatares disponibles">
            {AVATARS.map((avatar) => <button className={`cib20-avatar-option ${avatar.tone}${avatarId === avatar.id ? ' selected' : ''}`} key={avatar.id} type="button" onClick={() => setAvatarId(avatar.id)} aria-pressed={avatarId === avatar.id} aria-label={avatar.label}><span>{avatar.emoji}</span><small>{avatar.label}</small>{avatarId === avatar.id && <Check className="cib20-avatar-check" size={17} />}</button>)}
          </div>
        </div>
        {!initialProfile && <div className="cib20-pin-section">
          <label className="cib20-label" htmlFor="temporary-pin"><LockKeyhole size={17} /> Configura un PIN temporal</label>
          <p className="cib20-hint">Crea un PIN de 6 dígitos. El CiberHéroe lo cambiará en su primer ingreso.</p>
          <div className="cib20-pin-wrap"><input id="temporary-pin" className="cib20-input cib20-pin-input" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{6}" minLength={6} maxLength={6} value={temporaryPin} onChange={(event) => setTemporaryPin(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" type={showPin ? 'text' : 'password'} required /><button type="button" className="cib20-pin-toggle" onClick={() => setShowPin((value) => !value)} aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}>{showPin ? 'Ocultar' : 'Mostrar'}</button></div>
        </div>}
        {initialProfile && <div className="cib20-pin-notice"><LockKeyhole size={22} /><div><strong>PIN del perfil</strong><span>{initialProfile.mustChangePin ? 'El niño debe cambiar su PIN en su próximo acceso.' : 'El perfil ya configuró su PIN personal.'}</span></div><b>{initialProfile.mustChangePin ? 'Cambio pendiente' : 'Configurado'}</b></div>}
        {error && <p className="cib20-error" role="alert">{error}</p>}
        <div className="cib20-editor-actions"><button className="cib20-secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancelar</button><button className="cib20-primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Guardando…' : initialProfile ? 'Guardar cambios' : 'Crear CiberHéroe'} <Check size={18} /></button></div>
      </form>
      <p className="cib20-editor-footnote"><Sparkles size={16} /> {selected.emoji} {selected.label} seleccionado · Pipo te acompaña en cada paso</p>
    </section>
  );
}

export default function GuardianSpacePage({ onLogin, onHome }) {
  const [familyCode, setFamilyCode] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [sessionStatus, setSessionStatus] = useState('checking');
  const [pageError, setPageError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingProfileId, setDeletingProfileId] = useState(null);

  const loadSpace = useCallback(async () => {
    setSessionStatus('checking'); setPageError('');
    try {
      const [family, result] = await Promise.all([getGuardianFamily(), getChildProfiles()]);
      setFamilyCode(family.familyCode);
      setProfiles((result.profiles || []).map((profile) => ({ ...profile, id: profile.id || profile._id })));
      setSessionStatus('authenticated');
    } catch (error) {
      if (error.status === 401) { onLogin(); return; }
      setPageError(error.code === 'FAMILY_NOT_FOUND' ? 'Tu cuenta todavía no tiene una familia asociada.' : 'No pudimos comprobar tu sesión. Revisa tu conexión e inténtalo de nuevo.');
      setSessionStatus('error');
    }
  }, [onLogin]);
  useEffect(() => { loadSpace(); }, [loadSpace]);

  async function saveProfile(values) {
    setIsSaving(true);
    setSuccessMessage('');
    try {
      if (editingProfile) {
        const result = await updateChildProfile(editingProfile.id, { nickname: values.nickname, avatarId: values.avatarId });
        const updatedProfile = { ...result.profile, id: result.profile.id || result.profile._id || editingProfile.id };
        setProfiles((current) => current.map((profile) => profile.id === editingProfile.id ? updatedProfile : profile));
        setSuccessMessage('¡Perfil de CiberHéroe actualizado correctamente!');
      } else {
        const result = await createChildProfile(values);
        const createdProfile = { ...result.profile, id: result.profile.id || result.profile._id };
        if (!createdProfile.id) throw new Error('PROFILE_RESPONSE_INVALID');
        setProfiles((current) => [...current, createdProfile]);
        setSuccessMessage('¡CiberHéroe creado correctamente!');
      }
      setShowForm(false);
      setEditingProfile(null);
    } finally { setIsSaving(false); }
  }

  async function handleDeleteProfile(profile) {
    const confirmed = window.confirm(`¿Estás seguro de eliminar el perfil de ${profile.nickname}?`);
    if (!confirmed) return;
    setDeletingProfileId(profile.id);
    setPageError('');
    setSuccessMessage('');
    try {
      await deleteChildProfile(profile.id);
      setProfiles((current) => current.filter((item) => item.id !== profile.id));
      setSuccessMessage(`El perfil de ${profile.nickname} se eliminó correctamente.`);
    } catch (error) {
      const messages = {
        PROFILE_NOT_FOUND: 'Este perfil ya no existe. Actualiza la lista.',
        INVALID_PROFILE_ID: 'No se pudo identificar el perfil que deseas eliminar.',
        FAMILY_NOT_FOUND: 'No encontramos tu familia. Vuelve a iniciar sesión.',
      };
      setPageError(messages[error.code] || 'No pudimos eliminar el perfil. Inténtalo otra vez.');
    } finally {
      setDeletingProfileId(null);
    }
  }
  async function copyFamilyCode() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(familyCode);
      setCopyMessage('Código familiar copiado.');
    } catch { setCopyMessage(`Copia este código manualmente: ${familyCode}`); }
  }
  async function handleLogout() {
    setIsLoggingOut(true);
    try { await logoutGuardian(); onHome(); }
    catch (error) {
      if (error.status === 401) { onHome(); return; }
      setPageError('No se pudo cerrar la sesión. Inténtalo de nuevo.');
      setIsLoggingOut(false);
    }
  }

  if (sessionStatus === 'checking') return <main className="guardian-space-placeholder guardian-space-status"><p role="status">Comprobando tu sesión del Guardián…</p></main>;
  if (sessionStatus === 'error') return <main className="guardian-space-placeholder guardian-space-status"><p role="alert">{pageError}</p><button className="cib20-primary-button" type="button" onClick={loadSpace}><RefreshCw size={17} /> Reintentar</button><button className="cib20-secondary-button" type="button" onClick={onHome}>Volver al inicio</button></main>;

  if (showForm) return <main className="guardian-dashboard"><ProfileForm initialProfile={editingProfile} onCancel={() => { setShowForm(false); setEditingProfile(null); }} onSave={saveProfile} isSaving={isSaving} /></main>;

  return (
    <main className="guardian-dashboard">
      <header className="guardian-dashboard-header">
        <div className="guardian-dashboard-brand"><ShieldCheck size={34} /><span>Ciber<span>Héroes</span></span></div>
        <nav className="guardian-dashboard-nav" aria-label="Navegación del Guardián"><span className="active"><UsersRound size={18} /> Mi familia</span></nav>
        <div className="guardian-dashboard-actions"><span className="guardian-welcome-label">Espacio del Guardián</span><button className="cib20-secondary-button" type="button" onClick={handleLogout} disabled={isLoggingOut}><LogOut size={17} /> {isLoggingOut ? 'Cerrando…' : 'Cerrar sesión'}</button></div>
      </header>
      <section className="guardian-dashboard-intro"><p className="cib20-eyebrow"><i /> ESPACIO DEL GUARDIÁN</p><h1>¡Estos son tus CiberHéroes!</h1><p>Administra los perfiles de tu familia y acompáñalos en cada aventura.</p></section>
      <section className="guardian-family-card" aria-label="Código familiar">
        <div className="guardian-family-icon"><ShieldCheck size={30} /></div>
        <div className="guardian-family-copy"><span>Código de tu equipo</span><strong>{familyCode || 'No disponible'}</strong><small>Este código es privado. Compártelo únicamente con tu familia.</small>{copyMessage && <small className="cib20-copy-message" role="status">{copyMessage}</small>}</div>
        <button className="cib20-secondary-button" type="button" onClick={copyFamilyCode} disabled={!familyCode}><Copy size={18} /> Copiar código</button>
      </section>
      <section className="guardian-profiles-section">
        <div className="guardian-section-heading"><div><p className="cib20-eyebrow">PERFILES INFANTILES</p><h2>Tu equipo de CiberHéroes</h2><p>Gestiona sus perfiles, avatares y accesos.</p></div>
          <button className="cib20-primary-button" type="button" onClick={() => { setSuccessMessage(''); setEditingProfile(null); setShowForm(true); }}><Plus size={19} /> Agregar CiberHéroe</button>
        </div>
        {successMessage && <p className="cib20-success" role="status"><Check size={17} /> {successMessage}</p>}
        {pageError && <p className="cib20-error" role="alert">{pageError}</p>}
        {profiles.length === 0 ? <div className="cib20-empty-state"><div className="cib20-empty-art">🛡️</div><h3>¡Tu equipo está por comenzar!</h3><p>Aún no has creado perfiles infantiles. Agrega el primero para iniciar esta aventura.</p><button className="cib20-primary-button" type="button" onClick={() => setShowForm(true)}><Plus size={18} /> Crear primer perfil</button></div> : (
          <div className="cib20-profile-grid">{profiles.map((profile) => { const avatar = avatarFor(profile.avatarId); return <article className="cib20-profile-card" key={profile.id}><div className={`cib20-profile-avatar ${avatar.tone}`} aria-hidden="true">{avatar.emoji}</div><div className="cib20-profile-info"><h3>{profile.nickname}</h3><span>{avatar.label}</span><small className={profile.mustChangePin ? 'pending' : 'ready'}>{profile.mustChangePin ? 'Cambio de PIN pendiente' : 'PIN configurado'}</small></div><div className="cib20-profile-actions"><button className="cib20-icon-button" type="button" onClick={() => { setSuccessMessage(''); setEditingProfile(profile); setShowForm(true); }} aria-label={`Editar perfil de ${profile.nickname}`} title="Editar perfil"><Pencil size={18} /><span>Editar</span></button><button className="cib20-icon-button cib20-delete-button" type="button" onClick={() => handleDeleteProfile(profile)} disabled={deletingProfileId === profile.id} aria-label={`Eliminar perfil de ${profile.nickname}`} title="Eliminar perfil"><Trash2 size={18} /><span>{deletingProfileId === profile.id ? 'Eliminando…' : 'Eliminar'}</span></button></div></article>; })}</div>
        )}
      </section>
      <footer className="guardian-dashboard-footer"><span><ShieldCheck size={16} /> Los PIN se almacenan protegidos.</span><button type="button" onClick={loadSpace}><RefreshCw size={15} /> Actualizar perfiles</button></footer>
    </main>
  );
}
