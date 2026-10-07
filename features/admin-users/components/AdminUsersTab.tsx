'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SYSTEM_MODULES } from '@/lib/navigation/registry';

/* ──── Types ──── */
interface UserRow {
  id: string; email: string; nombre_completo: string;
  rol_id: string | null; rol_nombre: string;
  permisos: Record<string, unknown>;
  activo: boolean; creado_en: string; ultimo_ingreso: string | null;
}
interface RolRow {
  id: string; nombre: string; descripcion: string | null;
  permisos: Record<string, unknown>;
}
type View = 'usuarios' | 'roles';

/* ──── Modulos del Sistema (Sincronizado con SYSTEM_MODULES) ──── */
const MODULE_COLORS: Record<string, string> = {
  dashboard: '#38bdf8',
  live_sheets: '#a78bfa',
  inventario: '#fb923c',
  cobros: '#4ade80',
  directorio_clientes: '#38bdf8',
  scanner: '#f472b6',
  dni_matrix: '#fbbf24',
  rotulos: '#34d399',
  boletas_shalom: '#60a5fa',
  formato_entrega: '#c084fc',
  invoices: '#34d399',
  info_amex: '#f87171',
  completar_inventario: '#38bdf8',
  auditoria: '#a78bfa',
  admin_usuarios: '#fb923c',
  despacho_rutas: '#38bdf8',
  manifiestos_tib: '#06b6d4',
};

const MODULOS: { key: string; number: number; label: string; icon: string; color: string }[] = SYSTEM_MODULES.map(m => ({
  key: m.permissionKey,
  number: m.number,
  label: m.label,
  icon: m.icon.replace(/^fa-solid\s+/, ''),
  color: MODULE_COLORS[m.permissionKey] || '#38bdf8'
}));

function isModuleEnabledForRole(permisos: Record<string, unknown> | undefined, moduleKey: string): boolean {
  if (!permisos) return false;
  const val = permisos[moduleKey];
  if (typeof val === 'boolean') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.ver === true) return true;
    return Object.values(obj).some(v => v === true);
  }
  const sysMod = SYSTEM_MODULES.find(sm => sm.permissionKey === moduleKey);
  if (sysMod?.permissionAliases) {
    for (const alias of sysMod.permissionAliases) {
      const aVal = permisos[alias];
      if (typeof aVal === 'boolean' && aVal) return true;
      if (typeof aVal === 'object' && aVal !== null) {
        const obj = aVal as Record<string, unknown>;
        if (obj.ver === true || Object.values(obj).some(v => v === true)) return true;
      }
    }
  }
  return false;
}

/* ──── Helpers ──── */
const ROL_COLORS: Record<string, { bg:string; text:string; border:string; grad:string }> = {
  Administrador: { bg:'rgba(167,139,250,0.15)', text:'#a78bfa', border:'rgba(167,139,250,0.4)', grad:'linear-gradient(135deg,#7c3aed,#a78bfa)' },
  _default:      { bg:'rgba(56,189,248,0.15)',  text:'#38bdf8',  border:'rgba(56,189,248,0.4)',  grad:'linear-gradient(135deg,#2563eb,#38bdf8)' },
};
const rolColor = (n: string) => ROL_COLORS[n] ?? ROL_COLORS._default;

const AVATAR_GRADS = [
  'linear-gradient(135deg,#2563eb,#7c3aed)',
  'linear-gradient(135deg,#0891b2,#2563eb)',
  'linear-gradient(135deg,#059669,#0891b2)',
  'linear-gradient(135deg,#d97706,#dc2626)',
  'linear-gradient(135deg,#7c3aed,#db2777)',
];
function avatarGrad(id: string): string {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_GRADS[h % AVATAR_GRADS.length];
}
function avatarInitials(name: string): string {
  const p = name.trim().split(' ');
  return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : name.slice(0,2).toUpperCase();
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso), now = new Date(), diff = now.getTime() - d.getTime();
  const min = Math.floor(diff/60000);
  if (min < 1)  return 'Hace un momento';
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min/60);
  if (h < 24) return `Hace ${h}h`;
  const days = Math.floor(h/24);
  if (days < 7) return `Hace ${days} dias`;
  return d.toLocaleDateString('es-PE',{day:'2-digit',month:'short',year:'numeric'});
}

/* ──── Shared styles ──── */
const card: React.CSSProperties = { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 };
const inputSt: React.CSSProperties = { width:'100%', padding:'11px 14px', borderRadius:10, fontSize:13, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'#f8fafc', outline:'none', boxSizing:'border-box' };
const labelSt: React.CSSProperties = { display:'block', marginBottom:6, fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px' };
const btnGreen: React.CSSProperties = { padding:'10px 22px', borderRadius:10, background:'linear-gradient(135deg,#059669,#065f46)', color:'#fff', border:'none', fontWeight:700, fontSize:13, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(5,150,105,0.3)' };
const btnBlue: React.CSSProperties  = { padding:'10px 22px', borderRadius:10, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', border:'none', fontWeight:700, fontSize:13, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(37,99,235,0.3)' };

/* ──── StatCard ──── */
function StatCard({ label, value, icon, color, sub }: { label:string; value:number; icon:string; color:string; sub?:string }) {
  return (
    <div style={{ ...card, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:color, opacity:0.07, filter:'blur(20px)', pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <p style={{ margin:0, fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</p>
          <div style={{ fontSize:36, fontWeight:900, color:'#f8fafc', lineHeight:1.1, marginTop:6 }}>{value}</div>
          {sub && <p style={{ margin:'6px 0 0', fontSize:11, color:'#475569' }}>{sub}</p>}
        </div>
        <div style={{ width:42, height:42, borderRadius:12, background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <i className={`fa-solid ${icon}`} style={{ color, fontSize:17 }} />
        </div>
      </div>
    </div>
  );
}

/* ──── Modal ──── */
function Modal({ title, subtitle, onClose, children, width=560 }: { title:string; subtitle?:string; onClose:()=>void; children:React.ReactNode; width?:number }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', padding:16 }} onClick={onClose}>
      <div style={{ background:'linear-gradient(160deg,#1e293b 0%,#0f172a 100%)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:20, width:'100%', maxWidth:width, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'22px 28px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <h3 style={{ margin:0, color:'#f8fafc', fontSize:17, fontWeight:900 }}>{title}</h3>
            {subtitle && <p style={{ margin:'4px 0 0', fontSize:12, color:'#64748b' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', width:34, height:34, borderRadius:8, cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'24px 28px 28px' }}>{children}</div>
      </div>
    </div>
  );
}

/* ══════════════ MAIN ══════════════ */
export default function AdminUsersTab() {
  const [view, setView]     = useState<View>('usuarios');
  const [users, setUsers]   = useState<UserRow[]>([]);
  const [roles, setRoles]   = useState<RolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState<{ msg:string; ok:boolean }|null>(null);
  const [search, setSearch] = useState('');

  const [showUM, setShowUM]   = useState(false);
  const [editU, setEditU]     = useState<UserRow|null>(null);
  const [uForm, setUForm]     = useState({ nombre_completo:'', email:'', password:'', rol_id:'', activo:true });
  const [savingU, setSavingU] = useState(false);

  const [showRM, setShowRM]   = useState(false);
  const [editR, setEditR]     = useState<RolRow|null>(null);
  const [rForm, setRForm]     = useState({ nombre:'', descripcion:'', permisos:{} as Record<string,boolean> });
  const [savingR, setSavingR] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/users');
      if (!r.ok) throw new Error('Error al cargar');
      const j = await r.json();
      setUsers(j.users || []); setRoles(j.roles || []);
    } catch(e) { showToast((e as Error).message, false); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);
  function showToast(msg: string, ok: boolean) { setToast({ msg, ok }); }

  function openNewUser() { setEditU(null); setUForm({ nombre_completo:'', email:'', password:'', rol_id:roles[0]?.id||'', activo:true }); setShowUM(true); }
  function openEditUser(u: UserRow) { setEditU(u); setUForm({ nombre_completo:u.nombre_completo, email:u.email, password:'', rol_id:u.rol_id||'', activo:u.activo }); setShowUM(true); }
  async function saveUser() {
    setSavingU(true);
    try {
      const isEdit = !!editU;
      const body = isEdit
        ? { action:'update_user', user_id:editU!.id, rol_id:uForm.rol_id||null, activo:uForm.activo, ...(uForm.password&&{password:uForm.password}) }
        : { action:'create_user', email:uForm.email, password:uForm.password, nombre_completo:uForm.nombre_completo, rol_id:uForm.rol_id||null };
      const res = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error||'Error');
      showToast(isEdit ? 'Usuario actualizado.' : 'Usuario creado exitosamente.', true);
      setShowUM(false); load();
    } catch(e) { showToast((e as Error).message, false); }
    finally { setSavingU(false); }
  }
  async function toggleActivo(u: UserRow) {
    const res = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ action:'update_user', user_id:u.id, activo:!u.activo }) });
    if (!res.ok) return showToast('Error al cambiar estado', false);
    showToast(`Usuario ${!u.activo?'activado':'desactivado'}.`, true); load();
  }
  function openNewRole() { setEditR(null); const p: Record<string,boolean>={}; MODULOS.forEach(m=>{p[m.key]=false;}); setRForm({nombre:'',descripcion:'',permisos:p}); setShowRM(true); }
  function openEditRole(r: RolRow) { setEditR(r); const p: Record<string,boolean>={}; MODULOS.forEach(m=>{p[m.key]=isModuleEnabledForRole(r.permisos, m.key);}); setRForm({nombre:r.nombre,descripcion:r.descripcion||'',permisos:p}); setShowRM(true); }
  async function saveRole() {
    setSavingR(true);
    try {
      const isEdit = !!editR;
      const body = isEdit
        ? { action:'update_role', id:editR!.id, permisos:rForm.permisos, descripcion:rForm.descripcion }
        : { action:'create_role', nombre:rForm.nombre, descripcion:rForm.descripcion, permisos:rForm.permisos };
      const res = await fetch('/api/admin/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error||'Error');
      showToast(isEdit ? 'Rol actualizado.' : 'Rol creado.', true);
      setShowRM(false); load();
    } catch(e) { showToast((e as Error).message, false); }
    finally { setSavingR(false); }
  }

  const filtered = users.filter(u =>
    u.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.rol_nombre.toLowerCase().includes(search.toLowerCase())
  );
  const activos   = users.filter(u => u.activo).length;
  const inactivos = users.filter(u => !u.activo).length;

  return (
    <div style={{ padding:'28px 28px 60px', color:'#f8fafc', minHeight:'100vh', fontFamily:"'Inter','Segoe UI',sans-serif", maxWidth:1280 }}>

      {/* HERO HEADER */}
      <div style={{ marginBottom:28, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(37,99,235,0.35)' }}>
            <i className="fa-solid fa-user-gear" style={{ color:'#fff', fontSize:22 }} />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:'#f8fafc', letterSpacing:'-0.3px' }}>Gestion de Usuarios y Roles</h1>
            <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748b' }}>Administra accesos, permisos y niveles de seguridad del sistema</p>
          </div>
        </div>
        <button onClick={load} style={{ padding:'9px 18px', borderRadius:9, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', fontWeight:700, cursor:'pointer', fontSize:13, display:'inline-flex', alignItems:'center', gap:8 }}>
          <i className="fa-solid fa-arrows-rotate" /> Actualizar
        </button>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ padding:'13px 20px', borderRadius:12, marginBottom:22, display:'flex', alignItems:'center', gap:12, fontSize:13, fontWeight:600, background:toast.ok?'rgba(5,150,105,0.12)':'rgba(220,38,38,0.12)', border:`1px solid ${toast.ok?'rgba(52,211,153,0.35)':'rgba(248,113,113,0.35)'}`, color:toast.ok?'#34d399':'#f87171' }}>
          <i className={`fa-solid ${toast.ok?'fa-circle-check':'fa-circle-xmark'}`} style={{ fontSize:16 }} />
          {toast.msg}
          <button onClick={()=>setToast(null)} style={{ marginLeft:'auto', background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
        </div>
      )}

      {/* STAT CARDS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16, marginBottom:28 }}>
        <StatCard label="Total Usuarios"  value={users.length} icon="fa-users"       color="#38bdf8" sub={`${activos} activos · ${inactivos} inactivos`} />
        <StatCard label="Activos"         value={activos}      icon="fa-user-check"  color="#34d399" sub="Con acceso al sistema" />
        <StatCard label="Inactivos"       value={inactivos}    icon="fa-user-xmark"  color="#f87171" sub="Acceso suspendido" />
        <StatCard label="Roles creados"   value={roles.length} icon="fa-shield-halved" color="#a78bfa" sub="Perfiles de permiso" />
      </div>

      {/* NAV TABS */}
      <div style={{ display:'flex', gap:6, marginBottom:24, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:5, width:'fit-content' }}>
        {[
          { k:'usuarios', label:'Usuarios del sistema', icon:'fa-users' },
          { k:'roles',    label:'Roles y Permisos',     icon:'fa-shield-halved' },
        ].map(t => (
          <button key={t.k} onClick={()=>setView(t.k as View)} style={{ padding:'9px 22px', borderRadius:9, border:'none', cursor:'pointer', fontWeight:700, fontSize:13, display:'inline-flex', alignItems:'center', gap:8, transition:'all 0.18s', background:view===t.k?'linear-gradient(135deg,#2563eb,#1d4ed8)':'transparent', color:view===t.k?'#fff':'#64748b', boxShadow:view===t.k?'0 4px 12px rgba(37,99,235,0.3)':'none' }}>
            <i className={`fa-solid ${t.icon}`} />{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...card, padding:'60px 0', textAlign:'center', color:'#475569' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize:34, marginBottom:14, display:'block', color:'#2563eb' }} />
          <p style={{ margin:0, fontSize:14 }}>Cargando datos del sistema...</p>
        </div>
      ) : (
        <>
          {/* ═══ USUARIOS ═══ */}
          {view === 'usuarios' && (
            <div>
              <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
                <div style={{ flex:1, minWidth:240, position:'relative' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#475569', fontSize:13, pointerEvents:'none' }} />
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre, email o rol..." style={{ ...inputSt, paddingLeft:40 }} />
                </div>
                <span style={{ fontSize:12, color:'#475569' }}>{filtered.length} resultado{filtered.length!==1?'s':''}</span>
                <button onClick={openNewUser} style={btnGreen}><i className="fa-solid fa-user-plus" /> Nuevo Usuario</button>
              </div>

              {filtered.length === 0 ? (
                <div style={{ ...card, padding:'50px 0', textAlign:'center', color:'#475569' }}>
                  <i className="fa-solid fa-users-slash" style={{ fontSize:36, marginBottom:12, display:'block', opacity:0.5 }} />
                  <p style={{ margin:0 }}>No se encontraron usuarios</p>
                </div>
              ) : (
                <div style={{ ...card, overflow:'hidden' }}>
                  {/* Header row */}
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.3fr 110px 160px 90px', padding:'13px 22px', background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    {['Usuario','Correo electronico','Rol asignado','Estado','Ultimo acceso','Acciones'].map(h=>(
                      <span key={h} style={{ fontSize:10, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'0.9px' }}>{h}</span>
                    ))}
                  </div>
                  {/* Data rows */}
                  {filtered.map((u,i) => {
                    const rc = rolColor(u.rol_nombre);
                    return (
                      <div key={u.id} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.3fr 110px 160px 90px', padding:'16px 22px', borderBottom:i<filtered.length-1?'1px solid rgba(255,255,255,0.04)':'none', alignItems:'center', transition:'background 0.15s', cursor:'default' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.025)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                      >
                        {/* Col: avatar + nombre */}
                        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                          <div style={{ width:40, height:40, borderRadius:12, background:avatarGrad(u.id), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:13, color:'#fff', flexShrink:0, letterSpacing:'-0.5px' }}>
                            {avatarInitials(u.nombre_completo)}
                          </div>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontWeight:700, color:'#f1f5f9', fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.nombre_completo}</div>
                            <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>Desde {new Date(u.creado_en).toLocaleDateString('es-PE',{month:'short',year:'numeric'})}</div>
                          </div>
                        </div>
                        {/* Col: email */}
                        <div style={{ fontSize:13, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:8 }}>{u.email}</div>
                        {/* Col: rol */}
                        <div>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:rc.bg, color:rc.text, border:`1px solid ${rc.border}` }}>
                            <i className={`fa-solid ${u.rol_nombre==='Administrador'?'fa-crown':'fa-circle-user'}`} style={{ fontSize:10 }} />
                            {u.rol_nombre}
                          </span>
                        </div>
                        {/* Col: estado */}
                        <div>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:u.activo?'rgba(52,211,153,0.12)':'rgba(248,113,113,0.12)', color:u.activo?'#34d399':'#f87171', border:`1px solid ${u.activo?'rgba(52,211,153,0.3)':'rgba(248,113,113,0.3)'}` }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:u.activo?'#34d399':'#f87171', display:'inline-block', flexShrink:0 }} />
                            {u.activo?'Activo':'Inactivo'}
                          </span>
                        </div>
                        {/* Col: ultimo acceso */}
                        <div style={{ fontSize:12, color:'#475569' }}>
                          <i className="fa-regular fa-clock" style={{ marginRight:5 }} />
                          {fmtDate(u.ultimo_ingreso)}
                        </div>
                        {/* Col: acciones */}
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>openEditUser(u)} title="Editar usuario" style={{ width:34, height:34, borderRadius:8, background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.3)', color:'#60a5fa', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button onClick={()=>toggleActivo(u)} title={u.activo?'Suspender acceso':'Activar acceso'} style={{ width:34, height:34, borderRadius:8, background:u.activo?'rgba(239,68,68,0.12)':'rgba(52,211,153,0.12)', border:`1px solid ${u.activo?'rgba(239,68,68,0.3)':'rgba(52,211,153,0.3)'}`, color:u.activo?'#f87171':'#34d399', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                            <i className={`fa-solid ${u.activo?'fa-ban':'fa-check'}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ ROLES ═══ */}
          {view === 'roles' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:18 }}>
                <button onClick={openNewRole} style={btnGreen}><i className="fa-solid fa-plus" /> Nuevo Rol</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:18 }}>
                {roles.map(r => {
                  const rc = rolColor(r.nombre);
                  const usersR = users.filter(u=>u.rol_id===r.id);
                  const activeP = MODULOS.filter(m=>isModuleEnabledForRole(r.permisos, m.key));
                  const pct = Math.round((activeP.length/MODULOS.length)*100);
                  return (
                    <div key={r.id} style={{ ...card, padding:22, transition:'border-color 0.2s, transform 0.2s' }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor=rc.border; e.currentTarget.style.transform='translateY(-2px)'; }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}
                    >
                      {/* Header */}
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:46, height:46, borderRadius:13, background:rc.grad, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 16px ${rc.bg}` }}>
                            <i className="fa-solid fa-shield-halved" style={{ color:'#fff', fontSize:18 }} />
                          </div>
                          <div>
                            <div style={{ fontWeight:900, color:'#f1f5f9', fontSize:15 }}>{r.nombre}</div>
                            <div style={{ fontSize:11, color:'#475569', marginTop:2 }}>{activeP.length} de {MODULOS.length} modulos habilitados</div>
                          </div>
                        </div>
                        <button onClick={()=>openEditRole(r)} style={{ padding:'7px 14px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                          <i className="fa-solid fa-pen" />Editar
                        </button>
                      </div>

                      {r.descripcion && (
                        <p style={{ fontSize:12, color:'#64748b', margin:'0 0 14px', lineHeight:1.5, borderLeft:`3px solid ${rc.border}`, paddingLeft:10 }}>{r.descripcion}</p>
                      )}

                      {/* Progress bar */}
                      <div style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:11 }}>
                          <span style={{ color:'#475569', fontWeight:600 }}>Nivel de acceso</span>
                          <span style={{ color:rc.text, fontWeight:800 }}>{pct}%</span>
                        </div>
                        <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:4, height:7, overflow:'hidden' }}>
                          <div style={{ height:'100%', background:rc.grad, borderRadius:4, width:`${pct}%`, transition:'width 0.6s ease' }} />
                        </div>
                      </div>

                      {/* Pills */}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
                        {activeP.length===0 ? (
                          <span style={{ fontSize:11, color:'#475569', fontStyle:'italic' }}>Sin modulos asignados aun</span>
                        ) : activeP.map(m=>(
                          <span key={m.key} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700, background:`${m.color}18`, color:m.color, border:`1px solid ${m.color}33` }}>
                            <i className={`fa-solid ${m.icon}`} style={{ fontSize:9 }} />{m.label}
                          </span>
                        ))}
                      </div>

                      {/* Footer: avatars + count */}
                      <div style={{ paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ display:'flex' }}>
                            {usersR.slice(0,4).map((u,i2)=>(
                              <div key={u.id} title={u.nombre_completo} style={{ width:26, height:26, borderRadius:'50%', background:avatarGrad(u.id), border:'2px solid #0f172a', marginLeft:i2>0?-8:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#fff' }}>
                                {avatarInitials(u.nombre_completo)}
                              </div>
                            ))}
                            {usersR.length>4 && (
                              <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'2px solid #0f172a', marginLeft:-8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#94a3b8' }}>+{usersR.length-4}</div>
                            )}
                            {usersR.length===0 && <i className="fa-solid fa-user-slash" style={{ color:'#475569', fontSize:13 }} />}
                          </div>
                        </div>
                        <span style={{ fontSize:12, color:'#475569', fontWeight:600 }}>{usersR.length} {usersR.length===1?'usuario':'usuarios'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL USUARIO ═══ */}
      {showUM && (
        <Modal title={editU?'Editar Usuario':'Crear Nuevo Usuario'} subtitle={editU?`Modificando: ${editU.nombre_completo}`:'Completa los datos para registrar el acceso'} onClose={()=>setShowUM(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {!editU && (
              <>
                <div>
                  <label style={labelSt}>Nombre completo *</label>
                  <input value={uForm.nombre_completo} onChange={e=>setUForm(p=>({...p,nombre_completo:e.target.value}))} placeholder="Ej: Maria Lopez Rios" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Correo electronico *</label>
                  <input value={uForm.email} onChange={e=>setUForm(p=>({...p,email:e.target.value}))} placeholder="usuario@amexcourier.pe" type="email" style={inputSt} />
                </div>
              </>
            )}
            <div>
              <label style={labelSt}>{editU?'Nueva contrasena (vacio = sin cambios)':'Contrasena *'}</label>
              <input value={uForm.password} onChange={e=>setUForm(p=>({...p,password:e.target.value}))} placeholder={editU?'Dejar vacio para mantener actual':'Minimo 8 caracteres'} type="password" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Rol del sistema</label>
                  <select value={uForm.rol_id} onChange={e=>setUForm(p=>({...p,rol_id:e.target.value}))} style={{ ...inputSt, appearance:'none' as const }}>
                <option value="">— Sin rol asignado —</option>
                {roles.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
              {uForm.rol_id && (() => {
                const r = roles.find(x=>x.id===uForm.rol_id);
                if (!r) return null;
                const cnt = MODULOS.filter(m=>isModuleEnabledForRole(r.permisos, m.key)).length;
                const rc = rolColor(r.nombre);
                return <div style={{ marginTop:8, padding:'8px 12px', borderRadius:8, background:rc.bg, border:`1px solid ${rc.border}`, fontSize:12, color:rc.text, display:'flex', alignItems:'center', gap:8 }}><i className="fa-solid fa-info-circle" />Este rol tiene acceso a <strong>{cnt}</strong> de {MODULOS.length} modulos</div>;
              })()}
            </div>
            {editU && (
              <div>
                <label style={labelSt}>Estado de la cuenta</label>
                <div style={{ display:'flex', gap:10 }}>
                  {[
                    { v:true,  label:'Activo — puede iniciar sesion', icon:'fa-circle-check', color:'#34d399' },
                    { v:false, label:'Inactivo — sin acceso',         icon:'fa-ban',          color:'#f87171' },
                  ].map(opt=>(
                    <button key={String(opt.v)} onClick={()=>setUForm(p=>({...p,activo:opt.v}))} style={{ flex:1, padding:'10px 14px', borderRadius:10, border:`1.5px solid ${uForm.activo===opt.v?opt.color+'88':'rgba(255,255,255,0.1)'}`, background:uForm.activo===opt.v?opt.color+'18':'transparent', color:uForm.activo===opt.v?opt.color:'#475569', cursor:'pointer', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }}>
                      <i className={`fa-solid ${opt.icon}`} style={{ fontSize:14 }} />{opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={()=>setShowUM(false)} style={{ padding:'10px 22px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontWeight:700, cursor:'pointer' }}>Cancelar</button>
              <button onClick={saveUser} disabled={savingU} style={{ ...btnGreen, opacity:savingU?0.65:1 }}>
                <i className={`fa-solid ${savingU?'fa-spinner fa-spin':'fa-floppy-disk'}`} />
                {savingU?'Guardando...':editU?'Guardar cambios':'Crear usuario'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══ MODAL ROL ═══ */}
      {showRM && (
        <Modal title={editR?`Editar rol: ${editR.nombre}`:'Crear nuevo rol'} subtitle="Selecciona los módulos a los que tendrá acceso" onClose={()=>setShowRM(false)} width={640}>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {!editR && (
              <div>
                <label style={labelSt}>Nombre del rol *</label>
                <input value={rForm.nombre} onChange={e=>setRForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Supervisor de Almacen" style={inputSt} />
              </div>
            )}
            <div>
              <label style={labelSt}>Descripcion del rol</label>
              <input value={rForm.descripcion} onChange={e=>setRForm(p=>({...p,descripcion:e.target.value}))} placeholder="Que funciones cumple este perfil..." style={inputSt} />
            </div>
            {/* Permission matrix */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <label style={{ ...labelSt, margin:0 }}>Módulos del sistema</label>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <button onClick={()=>{const a: Record<string,boolean>={};MODULOS.forEach(m=>{a[m.key]=true;});setRForm(p=>({...p,permisos:a}));}} style={{ padding:'4px 11px', borderRadius:6, background:'rgba(52,211,153,0.12)', border:'1px solid rgba(52,211,153,0.3)', color:'#34d399', cursor:'pointer', fontSize:11, fontWeight:700 }}>Todo</button>
                  <button onClick={()=>{const n: Record<string,boolean>={};MODULOS.forEach(m=>{n[m.key]=false;});setRForm(p=>({...p,permisos:n}));}} style={{ padding:'4px 11px', borderRadius:6, background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', cursor:'pointer', fontSize:11, fontWeight:700 }}>Ninguno</button>
                  <span style={{ fontSize:12, color:'#38bdf8', fontWeight:800 }}>{Object.values(rForm.permisos).filter(Boolean).length}/{MODULOS.length}</span>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxHeight:380, overflowY:'auto', paddingRight:4 }}>
                {MODULOS.map(m => {
                  const on = !!rForm.permisos[m.key];
                  return (
                    <div key={m.key} onClick={()=>setRForm(p=>({...p,permisos:{...p.permisos,[m.key]:!p.permisos[m.key]}}))} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:10, cursor:'pointer', userSelect:'none', transition:'all 0.15s', background:on?`${m.color}12`:'rgba(255,255,255,0.03)', border:`1.5px solid ${on?m.color+'55':'rgba(255,255,255,0.07)'}` }}>
                      <div style={{ width:20, height:20, borderRadius:5, flexShrink:0, background:on?m.color:'rgba(255,255,255,0.08)', border:`1.5px solid ${on?m.color:'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                        {on && <i className="fa-solid fa-check" style={{ fontSize:9, color:'#fff' }} />}
                      </div>
                      <div style={{ width:28, height:28, borderRadius:8, background:on?`${m.color}20`:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <i className={`fa-solid ${m.icon}`} style={{ fontSize:12, color:on?m.color:'#475569' }} />
                      </div>
                      <span style={{ fontSize:12, color:on?'#f1f5f9':'#64748b', fontWeight:on?700:500, lineHeight:1.3 }}>{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={()=>setShowRM(false)} style={{ padding:'10px 22px', borderRadius:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontWeight:700, cursor:'pointer' }}>Cancelar</button>
              <button onClick={saveRole} disabled={savingR} style={{ ...btnBlue, opacity:savingR?0.65:1 }}>
                <i className={`fa-solid ${savingR?'fa-spinner fa-spin':'fa-floppy-disk'}`} />
                {savingR?'Guardando...':editR?'Guardar cambios':'Crear rol'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
