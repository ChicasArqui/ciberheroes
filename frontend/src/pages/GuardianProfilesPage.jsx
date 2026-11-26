import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, CircleAlert, Clock3, Copy, Download, LockKeyhole, LogOut, Plus, RefreshCw, ShieldCheck, Sparkles, Users, Trophy, Wifi, Fingerprint, KeyRound, MessageCircle, Pencil, X, Tablet, GraduationCap } from 'lucide-react';
import Brand from '../components/Brand.jsx';
import PipoScene from '../components/PipoScene.jsx';
import '../styles/guardian-profiles.css';

const AVATARS = [
  {id:'zorro',name:'Zorro Ágil',short:'Zorro',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuBCnrJOMDBL-tbqNrJAOjKmrIJubjdi71cTUkh0XclWvrGTJQ-xAq9SHJFocMu1MOOONavuAoYmAAgDY-sA4yNKTYY0mUP17Vxlw8nIlhtx6xslTZ1R8FEAOsD5gAGt4dNjHkz8FOPNsp3UOGocvA115wFS1_AFR7xAIUlNkdJWczNIdfI3Q98uvetoftzHhE6v2DjxYZU1zIcw99JzUFO91LYF_YpSB4xF9xjpVUfiLpMMxK3Uzhxz'},
  {id:'gati',name:'Gatita Curiosa',short:'Gatita',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuCOkVgOM7A0B3nKqtgySoGwPB4_DszGG3jVKqjtrWbYwds9oPbH2-Y4nWAafY1-HZa_URlvJsp45OPK6BK0uYfIurRa7cQEXFf53SJ41u2UtkMvWYyU6JRMyes2Dn1MqLN2KuHARCj056zu2RZSPbbN4x4GR30udA8eWC0PGgrZTqSANtcUwSDzg97jw3MXzzP7PDI5K4TBorMb1r0vx2s0t27hdGW4wyrt9xAAAc0LDlhyLrRU1_Hq'},
  {id:'can',name:'Perrito Valiente',short:'Perrito',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuBWJ2r7FplFd48KOeJYv3WPoK4pIvbIWL2md13IIlZ9Eb7L5t_i80MMOCFygvS9kf3pQP1b4AyvF0bkVrQltRGaXFiouuI91aauFDv08z0-N09TGgxaU5BqMai1E1PQO8rwXE5y2DTzUV8Fwix5A16Vk6QUDTiIYzS6m5B2ov_ztwRdeRLPwuPBXbo9hNe-DItjUbZfblxn678eAcPpsixrJ898ynIY0l78gSAQ1kzCxChDtIdgBarG'},
  {id:'cone',name:'Conejita Alerta',short:'Conejita',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuA4xJdSPsod1ewRmeeb7TP5SFw46sX5JkLS0og7mZTWM0FQ-SekBr96gypSXY5rnGd0nXX1QUQzgCxrg5lzJJvf4KnLocLPohzAlSUXUP_AJdgYwMGTpr7Yrgo0dW_Y5igcLXb8F1BMA0q0reX-jSG95B9A1F0qpmchPbvR6NqvKuar4Lo4GYJDqD3LMJD5tnfYb7fyxm91we6lAozuZwJTeHi-jj9vv9R1LIirCi0iG2B7LlT2kski'},
  {id:'pingui',name:'Pingüino Tech',short:'Pingüino',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuDrRW4NPgaXEbtEwOwcHatsmaPhp8d7UZjkoxYfXYy9r-ljv85w1Nem5z108M6wcldP7bIqY1fVB1zNXs1ZaDl2m_praaVtfEI4liS5jBw9dPgF6DhBhoUCYQwNUDOfTxRJpdbEJwehbBQs0LF97uHVPC0xvk67GjmxtdrbYUpYjmlc_nJHwYLfpVmTj3JH27x0QLcaho887JLaMTufeOOPlJ8Y8400_e4pGH-31pM904IyJBszroAM'},
  {id:'buho',name:'Búho Sabio',short:'Búho',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ8F7i3vd9lHG_GbK9dFneJaTcxhHGVeG1oumAbz_Z7uYJasBYjmna1ndae-KWfl5oQfyFG100NTD_zY33v1ZuMLJI9Il7jokyLOlLxSruZrcyotxpe06yxvA_8vKabT5kJ1hrScAPpqJEvEk6U8gl2ba9xaY-N-Dj1rducRc9ksIAgTn31W4r7DJjvqnIRghwenUQAK7tuBGk0axijzvN94wW8oDrHFwIQq15eyiaunpa2zBYCnTe'},
  {id:'mapache',name:'Mapache Hacker Ético',short:'Mapache',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuDBBIwjj9k0yvr9CNYGvz_yP51CuNNnmpA9tz6ebgyHgGBqwgbbjpd9RFpWyXddw1HQRY1D6vdcaLAVucTz6ccuNpQfTHWEHeHZY6FgfW9mM_JQZn1vdyU2veUhwiVWgFbKkMV6BmdRak7hiBE2bm0_P8PWe1NC_VQm_mFfauBTUHPzhR2n0PDtrselJPzakQ9_aPe3EMLAhxLkA0k2zBPbrhyaE0WAsRQHsli09Zfutp49zOTNYRcg'},
  {id:'koala',name:'Koala Sereno',short:'Koala',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuCiKBSYtsa7zqT6oImum3m9qJZW9i587fM2YrvCO4VGZWXQbrBDCSe1WSzb7bQWLrKbFtMCwsyn1miatBpw4yLXoETFGdt1i_IOEoDE0iHqegSZ3mTEiYIfMOxWW3Q6V0NFC8ztM5vF9h_OVxoSuHy2JDqGsTRaoFfkCad2lrAIocKrdk0vkZp6hB0obj6fVvJKqPnMmLLC0GYrGY5QKiCmqm_fPxjShoVJABCuAzBNSnq9PvDnDEGL'},
  {id:'leon',name:'León Protector',short:'León',src:'https://lh3.googleusercontent.com/aida-public/AB6AXuCpqDvkWDcDJU5c1veKLAhykTwnvF4RHnpcPg5Aa6KMbB_9VO1Hcy7X2_3q_IGa7fallGuS4AWSlRHJf4zFcc9eLjK8DULxrEzRJDjQONt1AOXUGSOjBx3jB5IDUe2Qo9S6KoI3Q4Ncx1Q09XJRe0oagbGpdDop5EnDtSvzGh2HgvkFT8QPUAcPSwaxKg1Azz3YQIk9sAyFoxvQZ7UlzC_vIBMI2x2XahQwSNuXb3HhXrDsMjUU6MBU'}
];
const API = import.meta.env.VITE_API_URL || '';
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {credentials:'include',...options,headers:{'Content-Type':'application/json',...options.headers}});
  const data = await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error(data?.error?.message||'No se pudo completar la solicitud.');error.status=response.status;throw error;}
  return data;
}
const avatarFor = id => AVATARS.find(a=>a.id===id)||AVATARS[0];

function ProfileCard({profile,onEdit}) {
  const avatar=avatarFor(profile.avatarId);
  return <article className="gp-hero-card">
    <div className="gp-hero-avatar"><img src={avatar.src} alt={avatar.name}/></div>
    <div className="gp-hero-info"><strong>{profile.nickname}</strong><span className="gp-hero-tag">{avatar.name}</span><small>{profile.ageRange||'Perfil infantil'}{profile.mustChangePin?' · Primer acceso pendiente':''}</small></div>
    <div className="gp-hero-actions"><span className={profile.mustChangePin?'gp-pin-state pending':'gp-pin-state'}><LockKeyhole size={12}/>{profile.mustChangePin?'PIN temporal activo':'PIN configurado'}</span><button type="button" onClick={()=>onEdit(profile)}><Pencil size={13}/> Editar perfil</button></div>
  </article>;
}

export default function GuardianProfilesPage({onBack}) {
  const [tab,setTab]=useState('inicio');
  const [profiles,setProfiles]=useState([]);
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState('');
  const [view,setView]=useState('list');
  const [editing,setEditing]=useState(null);
  const [nickname,setNickname]=useState('');
  const [avatarId,setAvatarId]=useState('zorro');
  const [ageRange,setAgeRange]=useState('');
  const [pin,setPin]=useState('');
  const [pinConfirm,setPinConfirm]=useState('');
  const [formError,setFormError]=useState('');
  const [saving,setSaving]=useState(false);
  const [confirmation,setConfirmation]=useState(null);
  const [toast,setToast]=useState('');
  const selectedAvatar=useMemo(()=>avatarFor(avatarId),[avatarId]);

  const notify=message=>{setToast(message);window.clearTimeout(notify.timer);notify.timer=window.setTimeout(()=>setToast(''),2800);};
  const loadProfiles=useCallback(async()=>{
    setLoading(true);setLoadError('');
    try{const data=await api('/api/guardian/profiles');setProfiles(Array.isArray(data.profiles)?data.profiles:[]);}
    catch(error){setLoadError(error.status===401?'Inicia sesión como Guardián para consultar los perfiles de tu familia.':'No se pudo conectar con el servicio de perfiles.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{loadProfiles();},[loadProfiles]);
  useEffect(()=>{
    if(tab==='heroes'&&(view==='create'||view==='edit')){
      const frame=requestAnimationFrame(()=>document.getElementById('gp-register-card')?.scrollIntoView({behavior:'smooth',block:'start'}));
      return ()=>cancelAnimationFrame(frame);
    }
  },[tab,view]);
  const go=next=>{setTab(next);setView('list');window.scrollTo({top:0,behavior:'smooth'});};
  const resetForm=()=>{setNickname('');setAvatarId('zorro');setAgeRange('');setPin('');setPinConfirm('');setEditing(null);setFormError('');};
  const openCreate=()=>{resetForm();setView('create');setTab('heroes');};
  const openEdit=profile=>{setEditing(profile);setNickname(profile.nickname||'');setAvatarId(profile.avatarId||'zorro');setAgeRange(profile.ageRange||'');setFormError('');setView('edit');setTab('heroes');};
  const generatePin=()=>{const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);setPin(String(100000+(bytes[0]%900000)));setPinConfirm('');};
  const submit=async e=>{
    e.preventDefault();setFormError('');
    if(nickname.trim().length<2||nickname.trim().length>24){setFormError('El apodo debe tener entre 2 y 24 caracteres.');return;}
    if(view==='create'&&(!/^\d{6}$/.test(pin)||pin!==pinConfirm)){setFormError(pin!==pinConfirm?'Los PIN ingresados no coinciden.':'El PIN debe contener seis dígitos.');return;}
    setSaving(true);
    try{
      if(view==='create'){
        await api('/api/guardian/profiles',{method:'POST',body:JSON.stringify({nickname:nickname.trim(),avatarId,ageRange,temporaryPin:pin})});
        setConfirmation({nickname:nickname.trim(),pin});
      }else{
        await api(`/api/guardian/profiles/${encodeURIComponent(editing.id)}`,{method:'PATCH',body:JSON.stringify({nickname:nickname.trim(),avatarId,ageRange})});
      }
      await loadProfiles();setView('list');notify(view==='create'?'Perfil creado correctamente.':'Perfil actualizado.');if(view==='edit')resetForm();
    }catch(error){setFormError(error.status===401?'Tu sesión no está activa. Inicia sesión e inténtalo nuevamente.':error.message);}
    finally{setSaving(false);}
  };
  const copyText=async value=>{try{await navigator.clipboard.writeText(value);notify('Copiado al portapapeles.');}catch{notify('No se pudo copiar automáticamente.');}};

  const total=profiles.length;

  return <div className="guardian-module">
    <header className="gp-topbar"><div className="gp-topbar-inner">
      <button className="gp-brand-button" type="button" onClick={()=>go('inicio')}><Brand/></button>
      <nav className="gp-main-nav" aria-label="Navegación del portal Guardián">
        <button className={tab==='inicio'?'active':''} onClick={()=>go('inicio')} type="button">Guardián</button>
        <button className={tab==='heroes'?'active':''} onClick={()=>go('heroes')} type="button">Mis CiberHéroes</button>
        <button className={tab==='progreso'?'active':''} onClick={()=>go('progreso')} type="button">Progreso</button>
        <button className={tab==='config'?'active':''} onClick={()=>go('config')} type="button">Configuración</button>
      </nav>
      <div className="gp-user"><span><strong>Espacio familiar</strong><small><i/> Sesión del Guardián</small></span><button type="button" onClick={onBack}><LogOut size={14}/> Salir</button></div>
    </div></header>

    <main className="gp-main">
      {tab==='inicio'&&<div className="gp-page">
        <section className="gp-home-hero">
          <div className="gp-home-copy"><span className="gp-eyebrow"><i/> ESPACIO FAMILIAR PROTEGIDO</span><h1>¡Hola, <em>Guardián!</em></h1><p>Acompaña las aventuras digitales de tus pequeños héroes en un entorno protegido, educativo y sin publicidad.</p>
            <div className="gp-home-meta"><span><Users size={14}/>{loading?'Consultando…':`${total} ${total===1?'perfil infantil':'perfiles infantiles'}`}</span><span className="gp-family-code"><LockKeyhole size={13}/> Código familiar: <b>••••••••</b></span></div>
          </div>
          <div className="gp-home-pipo"><div className="gp-pipo-speech"><b>✨ Pipo dice</b><strong>¡Hola! Soy Pipo.</strong><span>¿Listo para super-visar?</span></div><PipoScene welcome imageSrc="/assets/pipo_guardian.png"/></div>
        </section>

        <section className="gp-summary">
          <div className="gp-section-title"><div className="gp-section-icon"><GraduationCap size={17}/></div><div><h2>Resumen del Progreso Educativo Familiar</h2><p>Metas seguras alcanzadas juntos esta semana</p></div><span className="gp-data-tag">Datos de aprendizaje</span></div>
          <div className="gp-metric-grid">
            <div className="gp-metric"><span className="gp-metric-icon cyan"><BookOpen/></span><div><strong>—</strong><b>Lecciones completadas</b><small>Sin datos registrados</small></div></div>
            <div className="gp-metric"><span className="gp-metric-icon yellow"><Trophy/></span><div><strong>—</strong><b>Desafíos superados</b><small>Sin datos registrados</small></div></div>
            <div className="gp-metric"><span className="gp-metric-icon purple"><Clock3/></span><div><strong>—</strong><b>Tiempo seguro guiado</b><small>Sin datos registrados</small></div></div>
          </div>
          <div className="gp-week-card"><div><span>◎ Meta de exploración semanal en equipo</span><b>Datos pendientes</b></div><div className="gp-progress-track"><span style={{width:'0%'}}/></div><small>El avance se mostrará cuando estén disponibles los registros de actividad.</small></div>
        </section>

        <section className="gp-home-heroes">
          <div className="gp-section-title"><div className="gp-section-icon teal"><ShieldCheck size={17}/></div><div><h2>Tus CiberHéroes</h2><p>Perfiles activos y credenciales de acceso</p></div><button className="gp-manage-link" type="button" onClick={()=>go('heroes')}>Administrar escuadrón →</button></div>
          {loading&&<div className="gp-inline-state"><RefreshCw className="gp-spin"/> Consultando perfiles…</div>}
          {!loading&&loadError&&<div className="gp-inline-error"><CircleAlert size={17}/><span>{loadError}</span><button type="button" onClick={loadProfiles}>Reintentar</button></div>}
          {!loading&&!loadError&&<div className="gp-home-card-grid">
            {profiles.slice(0,2).map(profile=><ProfileCard key={profile.id} profile={profile} onEdit={openEdit}/>)}
            <button className="gp-add-hero" type="button" onClick={openCreate}><span><Plus size={23}/></span><strong>+ Agregar CiberHéroe</strong><small>Registra a un nuevo explorador</small><i>Nuevo perfil infantil</i></button>
            {profiles.length===0&&<div className="gp-empty-home"><Users size={20}/><span>Aún no hay perfiles infantiles registrados.</span></div>}
          </div>}
        </section>
      </div>}

      {tab==='heroes'&&<div className="gp-page">
        <section className="gp-page-head"><div><span className="gp-eyebrow blue">♟ ESCUADRÓN DIGITAL FAMILIAR</span><h1>Mis Pequeños CiberHéroes</h1><p>Administra los perfiles infantiles, actualiza sus avatares y configura su acceso seguro.</p></div><button className="gp-primary" onClick={openCreate} type="button"><Users size={15}/> Registrar Nuevo Héroe</button></section>
        <div className="gp-heroes-layout">
          <div className="gp-registered-grid">
            {loading&&<div className="gp-inline-state"><RefreshCw className="gp-spin"/> Cargando perfiles…</div>}
            {!loading&&loadError&&<div className="gp-inline-error"><CircleAlert size={17}/>{loadError}<button onClick={loadProfiles} type="button">Reintentar</button></div>}
            {!loading&&!loadError&&profiles.map(profile=><ProfileCard key={profile.id} profile={profile} onEdit={openEdit}/>)}
            {!loading&&!loadError&&profiles.length===0&&<div className="gp-empty-heroes"><Users size={24}/><strong>Aún no hay CiberHéroes registrados</strong><span>El primer perfil aparecerá aquí cuando lo registres.</span></div>}
            <button className="gp-add-hero gp-add-hero-large" type="button" onClick={openCreate}><span><Plus size={25}/></span><strong>+ Agregar otro CiberHéroe</strong><small>Registra un nuevo explorador</small></button>
          </div>
          <section className="gp-register-card" id="gp-register-card">
            <div className="gp-register-head"><div><span className="gp-eyebrow">FORMULARIO SEGURO PARA ADULTOS</span><h2>{view==='edit'?'Editar perfil infantil':'Registrar Nuevo CiberHéroe'}</h2><p>Configura un perfil protegido sin revelar información personal innecesaria.</p></div><span className="gp-private-pill"><ShieldCheck size={13}/> Privacidad infantil</span></div>
            <form onSubmit={submit}>
              <div className="gp-form-step"><div className="gp-step-title"><b>1</b><strong>Apodo de Aventuras y Elección de Avatar</strong></div>
                <div className="gp-fields-grid">
                  <label className="gp-field"><span>Apodo del Héroe o Heroína</span><input value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={24} placeholder="Ej. CapitánLucas" required/><small>Usa un apodo lúdico para no revelar nombres reales.</small></label>
                  <label className="gp-field"><span>Edad o Rango de Aprendizaje</span><select value={ageRange} onChange={e=>setAgeRange(e.target.value)} required><option value="">Selecciona un rango</option><option>6 a 8 años</option><option>9 a 11 años</option><option>12 a 13 años</option></select><small>Solo para adaptar el contenido educativo.</small></label>
                </div>
                <div className="gp-avatar-heading"><strong>Selecciona su Compañero de Escuadrón (9 Avatares Oficiales):</strong></div>
                <div className="gp-avatar-grid">{AVATARS.map(avatar=><button key={avatar.id} type="button" className={avatarId===avatar.id?'selected':''} onClick={()=>setAvatarId(avatar.id)} aria-pressed={avatarId===avatar.id}><img src={avatar.src} alt={avatar.name}/><span>{avatar.short}</span></button>)}</div>
                <p className="gp-selected-avatar">Avatar seleccionado: <strong>{selectedAvatar.name}</strong></p>
              </div>
              {view==='create'&&<div className="gp-form-step gp-pin-step"><div className="gp-step-title"><b>2</b><strong>Credencial Segura &amp; PIN Numérico</strong></div>
                <div className="gp-pin-row"><label className="gp-field"><span>PIN de inicio infantil (6 dígitos numéricos)</span><input className="gp-pin-input" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="••••••" required/></label><button className="gp-generate" type="button" onClick={generatePin}><Sparkles size={14}/> Generar aleatorio</button></div>
                <label className="gp-field gp-pin-confirm"><span>Confirmar PIN temporal</span><input className="gp-pin-input" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Repite los seis dígitos" required/></label>
                <div className="gp-privacy-note"><ShieldCheck size={17}/><p>El PIN temporal se usa para el primer acceso y debe cambiarse por uno definitivo. La confirmación se valida en este formulario y no se envía al servidor.</p></div>
              </div>}
              {formError&&<div className="gp-form-error" role="alert"><CircleAlert size={15}/>{formError}</div>}
              <div className="gp-form-actions"><button className="gp-cancel" type="button" onClick={()=>{setView('list');resetForm();}}>Cancelar</button><button className="gp-primary" type="submit" disabled={saving}>{saving?<RefreshCw className="gp-spin"/>:<Check size={15}/>} {view==='edit'?'Guardar cambios':'Guardar e Integrar al Escuadrón'}</button></div>
            </form>
          </section>
        </div>
      </div>}

      {tab==='progreso'&&<div className="gp-page gp-progress-page">
        <section className="gp-page-head progress-head"><div><span className="gp-eyebrow lilac">◉ PANEL PEDAGÓGICO Y HÁBITOS SEGUROS</span><h1>Progreso y Competencias Digitales</h1><p>Visualiza de forma constructiva los conocimientos adquiridos por cada explorador sin fomentar competencia desmedida.</p></div><button className="gp-secondary" type="button" disabled><Download size={15}/> Descargar Informe PDF</button></section>
        <div className="gp-progress-metrics">
          {[[ '—','Tasa Global Lograda','Sin registros'],['—','Lecciones Superadas','Contenido educativo'],['—','Retos Prácticos','Actividades completadas'],['—','Insignias de Valor','Reconocimientos']].map(([value,label,sub])=><div key={label}><strong>{value}</strong><b>{label}</b><small>{sub}</small></div>)}
        </div>
        <section className="gp-skills-card"><h2>Competencias y Habilidades Fundamentales</h2>
          {[[KeyRound,'Gestión y Creación de Contraseñas Seguras'],[Wifi,'Detección de Señuelos y Enlaces Trampa (Phishing)'],[Fingerprint,'Huella Digital y Respeto a los Demás en Red'],[ShieldCheck,'Conexión en Redes Wi-Fi Públicas y Desconocidas']].map(([Icon,label])=><div className="gp-skill" key={label}><div><span><Icon size={15}/>{label}</span><b>Sin datos</b></div><div className="gp-skill-track"><i/></div></div>)}
          <p className="gp-no-data">El progreso se mostrará cuando existan actividades y resultados registrados para los perfiles infantiles.</p>
        </section>
        <section className="gp-family-question"><span><MessageCircle size={25}/></span><div><h3>Pregunta para conversar en familia</h3><p>¿Qué harías si un juego en línea te promete recompensas a cambio de tu contraseña o de información personal?</p></div><button type="button" onClick={()=>notify('Las preguntas familiares se habilitarán con el contenido educativo.')}>Otra Pregunta</button></section>
      </div>}

      {tab==='config'&&<div className="gp-page gp-settings-page">
        <div className="gp-settings-heading"><h1>Ajustes del Portal Guardián</h1><p>Configura la seguridad del hogar, vincula dispositivos y administra las preferencias familiares.</p></div>
        <div className="gp-settings-grid">
          <div className="gp-settings-left">
            <section className="gp-account-card"><div className="gp-account-avatar"><Users size={30}/></div><h3>Cuenta del Guardián</h3><p>Datos de la cuenta familiar</p><span className="gp-not-connected">Información de cuenta no disponible</span><button type="button" disabled>Editar datos personales</button></section>
            <section className="gp-family-code-card"><span>CÓDIGO FAMILIAR DE VINCULACIÓN</span><div>••••••••<button type="button" disabled aria-label="Copiar código"><Copy size={16}/></button></div><p>El código se mostrará cuando el servicio de vinculación familiar esté habilitado.</p></section>
          </div>
          <div className="gp-settings-right">
            <section className="gp-preferences-card"><h3>Preferencias de Protección Infantil</h3>{[['Modo Seguro Familiar Automático','Controles de navegación segura del entorno.'],['Reportes Semanales por Correo','Resumen pedagógico y novedades familiares.'],['Límite Diario Saludable de Pantalla','Configuración de límites de tiempo de uso.']].map(([label,desc])=><div className="gp-preference" key={label}><div><b>{label}</b><p>{desc}</p></div><span className="gp-coming-soon">No disponible</span></div>)}</section>
            <section className="gp-devices-card"><div><h3>Dispositivos Autorizados</h3><span>Vinculación familiar</span></div><div className="gp-devices-empty"><Tablet size={25}/><p>No hay dispositivos vinculados disponibles para mostrar.</p></div></section>
            <section className="gp-session-card"><div><h4>Cierre de Sesión y Protección</h4><p>Vuelve a la selección de espacios del proyecto.</p></div><button type="button" onClick={onBack}><LogOut size={15}/> Salir del espacio</button></section>
          </div>

        </div>
      </div>}
    </main>
    <footer className="gp-footer"><span><ShieldCheck size={13}/> Entorno Seguro para Familias • CiberHéroes • Privacidad infantil</span><span><ShieldCheck size={13}/> Portal Guardián</span></footer>
    {toast&&<div className="gp-toast" role="status"><Check size={16}/>{toast}</div>}
    {confirmation&&<div className="gp-overlay"><section className="gp-confirm" role="dialog" aria-modal="true"><button className="gp-close" onClick={()=>setConfirmation(null)} type="button" aria-label="Cerrar"><X size={18}/></button><span className="gp-confirm-check"><Check size={24}/></span><h2>Perfil creado</h2><p>Entrega este PIN temporal a {confirmation.nickname}. Por seguridad, solo se muestra ahora.</p><strong>{confirmation.pin}</strong><button className="gp-secondary" onClick={()=>copyText(confirmation.pin)} type="button"><Copy size={15}/> Copiar PIN</button><p className="gp-confirm-note">El niño deberá cambiarlo en su primer acceso.</p><button className="gp-primary" onClick={()=>{setConfirmation(null);resetForm();}} type="button">Entendido</button></section></div>}
  </div>;
}
