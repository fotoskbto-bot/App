// components/ui.js
// ─────────────────────────────────────────────────────────────
// Reusable UI primitives for Macadamia Shop
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'

// ── Toast ─────────────────────────────────────────────────────
let toastFn = null
export function useToast() {
  const show = useCallback((msg, type = 'info', duration = 3000) => {
    if (toastFn) toastFn(msg, type, duration)
  }, [])
  return show
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastFn = (msg, type, duration) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
    }
    return () => { toastFn = null }
  }, [])

  return (
    <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div
      style={{ display:'flex', position:'fixed', inset:0, background:'rgba(20,10,5,.72)', zIndex:1000, alignItems:'flex-end', backdropFilter:'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="animate-slide-up" style={{ background:'var(--white)', borderRadius:'var(--r) var(--r) 0 0', width:'100%', maxWidth:600, margin:'0 auto', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px 18px', background:'linear-gradient(135deg,var(--cd),var(--cr))', color:'var(--cream)', borderRadius:'var(--r) var(--r) 0 0', position:'sticky', top:0, zIndex:1 }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', fontWeight:700 }}>{title}</span>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'none', background:'rgba(255,255,255,.15)', color:'var(--cream)', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        <div style={{ padding:18 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────
const BTN_STYLES = {
  p:    'linear-gradient(135deg,var(--cw),var(--cm))',
  ok:   'linear-gradient(135deg,#2e7d32,#388e3c)',
  d:    'linear-gradient(135deg,#c62828,#e53935)',
  i:    'linear-gradient(135deg,#00695c,#00897b)',
  warn: 'linear-gradient(135deg,#e65100,#f57c00)',
  s:    null,
  o:    null,
  cobrar: 'linear-gradient(135deg,var(--cd),var(--cr))',
}

export function Btn({ variant = 'p', size = 'md', full = false, loading = false, children, style = {}, ...props }) {
  const bg = BTN_STYLES[variant]
  const isOutline = variant === 'o'
  const isSecondary = variant === 's'
  const base = {
    padding: size === 'sm' ? '6px 11px' : size === 'lg' ? '14px 20px' : '10px 16px',
    fontSize: size === 'sm' ? '.78rem' : size === 'lg' ? '.98rem' : '.85rem',
    fontFamily: "'DM Sans',sans-serif",
    fontWeight: 600,
    borderRadius: 'var(--rs)',
    border: isOutline ? '2px solid var(--cw)' : 'none',
    cursor: props.disabled || loading ? 'not-allowed' : 'pointer',
    opacity: props.disabled || loading ? .6 : 1,
    background: isSecondary ? 'var(--cream)' : isOutline ? 'transparent' : bg,
    color: isSecondary ? 'var(--cd)' : isOutline ? 'var(--cw)' : variant === 'cobrar' ? 'var(--gold)' : 'white',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'all .2s',
    width: full ? '100%' : undefined,
    boxShadow: variant === 'p' ? '0 3px 12px rgba(139,69,19,.28)' : variant === 'cobrar' ? 'var(--shm)' : undefined,
    ...style,
  }
  return (
    <button {...props} style={base}>
      {loading ? <span className="spinner" style={{ width:16, height:16 }} /> : children}
    </button>
  )
}

// ── FormGroup ─────────────────────────────────────────────────
export function FG({ label, children, style = {} }) {
  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label style={{ display:'block', fontSize:'.73rem', fontWeight:600, color:'var(--cr)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</label>
      {children}
    </div>
  )
}

export function Input({ style = {}, ...props }) {
  return (
    <input
      {...props}
      style={{
        width:'100%', padding:'10px 13px',
        border:'1.5px solid #e8d9c8', borderRadius:'var(--rs)',
        fontFamily:"'DM Sans',sans-serif", fontSize:'.88rem',
        background:'var(--white)', color:'var(--cd)',
        outline:'none', transition:'border-color .2s, box-shadow .2s',
        ...style,
      }}
      onFocus={e => { e.target.style.borderColor='var(--cw)'; e.target.style.boxShadow='0 0 0 3px rgba(139,69,19,.1)' }}
      onBlur={e => { e.target.style.borderColor='#e8d9c8'; e.target.style.boxShadow='none' }}
    />
  )
}

export function Select({ children, style = {}, ...props }) {
  return (
    <select
      {...props}
      style={{
        width:'100%', padding:'10px 13px',
        border:'1.5px solid #e8d9c8', borderRadius:'var(--rs)',
        fontFamily:"'DM Sans',sans-serif", fontSize:'.88rem',
        background:'var(--white)', color:'var(--cd)',
        outline:'none', cursor:'pointer',
        ...style,
      }}
    >
      {children}
    </select>
  )
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background:'white', borderRadius:'var(--r)',
        padding: 15, boxShadow:'var(--sh)',
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'transform .2s, box-shadow .2s' : undefined,
        ...style,
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shm)' } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--sh)' } : undefined}
    >
      {children}
    </div>
  )
}

// ── SectionTitle ──────────────────────────────────────────────
export function STitle({ icon, children, style = {} }) {
  return (
    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'.93rem', fontWeight:600, color:'var(--cr)', marginBottom:11, display:'flex', alignItems:'center', gap:8, ...style }}>
      {icon && <span>{icon}</span>}
      {children}
      <div style={{ flex:1, height:1, background:'linear-gradient(to right,var(--cl),transparent)' }} />
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────
export function Empty({ icon = '☕', title, subtitle }) {
  return (
    <div style={{ textAlign:'center', padding:'36px 18px', color:'#bbb' }}>
      <div style={{ fontSize:'2rem', marginBottom:10 }}>{icon}</div>
      {title && <div style={{ fontSize:'.93rem', color:'#999', fontWeight:600, marginBottom:5 }}>{title}</div>}
      {subtitle && <div style={{ fontSize:'.82rem' }}>{subtitle}</div>}
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────────
export function Loading({ text = 'Cargando...' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'40px 20px', color:'var(--cw)' }}>
      <span className="spinner" />
      <span style={{ fontSize:'.88rem', fontWeight:500 }}>{text}</span>
    </div>
  )
}

// ── PayMethod selector ────────────────────────────────────────
export function PayMethods({ value, onChange }) {
  const methods = [
    { key: 'efectivo',   label: 'Efectivo',    icon: '💵' },
    { key: 'nequi',      label: 'Nequi',       icon: '📱' },
    { key: 'bancolombia',label: 'Bancolombia', icon: '🏦' },
    { key: 'daviplata',  label: 'Daviplata',   icon: '💳' },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:9, marginBottom:14 }}>
      {methods.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          style={{
            padding:11, borderRadius:'var(--rs)',
            border: value === m.key ? '2px solid var(--cw)' : '2px solid var(--cream)',
            background: value === m.key ? 'var(--cream)' : 'white',
            cursor:'pointer', textAlign:'center',
            fontFamily:"'DM Sans',sans-serif", fontSize:'.8rem', fontWeight:600,
            transition:'all .2s',
          }}
        >
          <div style={{ fontSize:'1.1rem', marginBottom:3 }}>{m.icon}</div>
          {m.label}
        </button>
      ))}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
export function fmt(n) {
  return Math.abs(parseFloat(n) || 0).toLocaleString('es-CO')
}

export function fmtDate(ds) {
  if (!ds) return ''
  const parts = ds.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return ds
}
