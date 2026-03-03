// pages/index.js
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useStore } from '../lib/useStore'
import { Modal, Btn, FG, Input, Select, Card, STitle, Empty, Loading, PayMethods, ToastContainer, useToast, fmt, fmtDate } from '../components/ui'

// ─────────────────────────────────────────────────────────────
// Logo inline (base64 se sirve desde /public/logo.jpg)
// ─────────────────────────────────────────────────────────────
const CUENTAS_INFO = {
  efectivo:    { label: 'Efectivo',     icon: '💵', color: '#d97706', bg: '#fef3c7', borderColor: 'var(--gold)' },
  nequi:       { label: 'Nequi',        icon: '📱', color: '#7c3aed', bg: '#ede9fe', borderColor: '#7c3aed' },
  bancolombia: { label: 'Bancolombia',  icon: '🏦', color: '#0284c7', bg: '#e0f2fe', borderColor: '#0284c7' },
  daviplata:   { label: 'Daviplata',    icon: '💳', color: '#059669', bg: '#d1fae5', borderColor: '#059669' },
}

// ══════════════════════════════════════════════════════════════
export default function App() {
  const store = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('caja')

  useEffect(() => { store.load() }, [])

  // ── Tab list ──────────────────────────────────────────────
  const tabs = [
    { key: 'caja',        label: 'Caja',         icon: '🧾' },
    { key: 'pendientes',  label: 'Pendientes',   icon: '⏳', badge: store.pendientesActivos().length },
    { key: 'creditos',    label: 'Créditos',     icon: '👤' },
    { key: 'gastos',      label: 'Gastos',       icon: '📋' },
    { key: 'resumen',     label: 'Resumen',      icon: '📊' },
    { key: 'movimientos', label: 'Movimientos',  icon: '📜' },
    { key: 'gf',          label: 'Gastos Fijos', icon: '📅' },
    { key: 'productos',   label: 'Productos',    icon: '☕' },
  ]

  if (store.loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--latte)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:12 }}>☕</div>
        <Loading text="Cargando Macadamia Shop..." />
      </div>
    </div>
  )

  if (store.error) return (
    <div style={{ padding:24, textAlign:'center' }}>
      <div style={{ fontSize:'2rem', marginBottom:8 }}>⚠️</div>
      <div style={{ color:'var(--err)', marginBottom:12 }}>{store.error}</div>
      <Btn onClick={store.load}>Reintentar</Btn>
    </div>
  )

  return (
    <>
      <Head>
        <title>Macadamia Shop — Caja</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ToastContainer />

      {/* ── HEADER ── */}
      <header style={{ background:'linear-gradient(135deg,var(--cd),var(--cdp) 50%,var(--cr))', padding:'13px 16px', boxShadow:'var(--shl)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:820, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="/logo.jpg" alt="Logo" style={{ width:46, height:46, borderRadius:'50%', objectFit:'cover', border:'2px solid var(--gold)', background:'white', padding:2 }} onError={e => { e.target.style.display='none' }} />
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', fontWeight:700, color:'var(--cream)' }}>Macadamia Shop</div>
              <div style={{ fontSize:'.62rem', color:'var(--steam)', letterSpacing:'1.5px', textTransform:'uppercase' }}>Sistema de Caja</div>
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(212,168,67,.3)', borderRadius:50, padding:'7px 16px', textAlign:'center' }}>
            <div style={{ fontSize:'.6rem', color:'var(--steam)', textTransform:'uppercase', letterSpacing:1 }}>Total General</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', fontWeight:700, color:'var(--gold)' }}>
              $ {fmt(Object.values(store.balancePorCuenta()).reduce((a,b) => a+b, 0))}
            </div>
          </div>
        </div>
      </header>

      {/* ── NAV TABS ── */}
      <div style={{ background:'var(--cd)', boxShadow:'0 3px 12px rgba(0,0,0,.3)', marginBottom:16 }}>
        <div style={{ maxWidth:820, margin:'0 auto', display:'flex', overflowX:'auto', scrollbarWidth:'none' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex:'0 0 auto', padding:'11px 16px', cursor:'pointer',
                fontSize:'.75rem', fontWeight:500, letterSpacing:'.3px',
                color: tab === t.key ? 'var(--gold)' : 'var(--steam)',
                borderBottom: tab === t.key ? '3px solid var(--gold)' : '3px solid transparent',
                background: tab === t.key ? 'rgba(212,168,67,.05)' : 'transparent',
                border:'none', fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap',
                transition:'all .2s', position:'relative',
              }}
            >
              {t.icon} {t.label}
              {!!t.badge && <span style={{ background:'var(--warn)', color:'white', borderRadius:9, padding:'1px 5px', fontSize:'.62rem', marginLeft:4 }}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth:820, margin:'0 auto', padding:'0 14px 90px' }}>
        {tab === 'caja'        && <TabCaja        store={store} toast={toast} />}
        {tab === 'pendientes'  && <TabPendientes  store={store} toast={toast} />}
        {tab === 'creditos'    && <TabCreditos    store={store} toast={toast} />}
        {tab === 'gastos'      && <TabGastos      store={store} toast={toast} />}
        {tab === 'resumen'     && <TabResumen     store={store} toast={toast} />}
        {tab === 'movimientos' && <TabMovimientos store={store} toast={toast} />}
        {tab === 'gf'          && <TabGastosFijos store={store} toast={toast} />}
        {tab === 'productos'   && <TabProductos   store={store} toast={toast} />}
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB: CAJA
// ══════════════════════════════════════════════════════════════
function TabCaja({ store, toast }) {
  const [orden, setOrden] = useState([])
  const [cliente, setCliente] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualMonto, setManualMonto] = useState('')
  const [showCobrar, setShowCobrar] = useState(false)
  const [cobrarMode, setCobrarMode] = useState('orden') // 'orden' | 'manual' | 'pendiente'
  const [payMethod, setPayMethod] = useState('efectivo')
  const [cobroNota, setCobroNota] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCierre, setShowCierre] = useState(false)

  const addProd = (p) => {
    setOrden(o => {
      const ex = o.find(i => i.id === p.id)
      if (ex) return o.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)
      return [...o, { ...p, qty: 1 }]
    })
  }
  const chgQty = (id, d) => setOrden(o => o.map(i => i.id === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0))
  const totalOrden = orden.reduce((s, i) => s + (parseFloat(i.precio) || 0) * i.qty, 0)

  const abrirCobrar = (mode) => { setCobrarMode(mode); setPayMethod('efectivo'); setCobroNota(''); setShowCobrar(true) }

  const confirmarCobro = async () => {
    setLoading(true)
    try {
      let concepto = '', monto = 0
      if (cobrarMode === 'manual') {
        if (!manualDesc || !manualMonto) { toast('Completa descripción y monto', 'warning'); setLoading(false); return }
        concepto = cliente ? `[${cliente}] ${manualDesc}` : manualDesc
        monto = parseFloat(manualMonto)
      } else {
        if (!orden.length) { toast('Agrega productos al pedido', 'warning'); setLoading(false); return }
        concepto = orden.map(i => `${i.qty}x ${i.nombre}`).join(', ')
        if (cliente) concepto = `[${cliente}] ${concepto}`
        if (cobroNota) concepto += ` (${cobroNota})`
        monto = totalOrden
      }
      await store.registrarVenta({ concepto, monto, cuenta: payMethod, cliente })
      toast(`✅ $${fmt(monto)} cobrado en ${CUENTAS_INFO[payMethod].label}`, 'success')
      setOrden([]); setCliente(''); setManualDesc(''); setManualMonto(''); setShowCobrar(false)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const guardarPendiente = async () => {
    if (!orden.length) { toast('Agrega productos al pedido', 'warning'); return }
    setLoading(true)
    try {
      await store.addPendiente({
        cliente: cliente || 'Sin nombre',
        concepto: orden.map(i => `${i.qty}x ${i.nombre}`).join(', '),
        total: String(totalOrden),
        items: JSON.stringify(orden),
      })
      toast(`⏳ Pedido de ${cliente || 'Sin nombre'} guardado como pendiente`, 'info')
      setOrden([]); setCliente('')
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const ventasHoy = store.ventasHoy()
  const txHoy = store.txHoy()
  const prods = store.productos.filter(p => p.activo !== 'false')

  return (
    <div className="animate-fade-in">
      {/* Header Caja */}
      <div style={{ background:'linear-gradient(135deg,var(--cr),var(--cw))', borderRadius:'var(--r)', padding:18, color:'white', marginBottom:14, boxShadow:'var(--shm)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem' }}>🧾 Caja Diaria</div>
            <div style={{ fontSize:'.75rem', opacity:.8, marginTop:2 }}>
              {new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })}
            </div>
          </div>
          <Btn variant="s" size="sm" style={{ background:'rgba(255,255,255,.2)', color:'white', border:'none' }} onClick={() => setShowCierre(true)}>
            🔒 Cerrar Caja
          </Btn>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginTop:12 }}>
          {[
            { label:'Ventas Hoy', val:`$ ${fmt(ventasHoy)}` },
            { label:'Transacc.', val: txHoy },
            { label:'Ticket Prom.', val: txHoy > 0 ? `$ ${fmt(ventasHoy / txHoy)}` : '$ 0' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,.15)', borderRadius:'var(--rs)', padding:9, textAlign:'center' }}>
              <div style={{ fontSize:'.58rem', opacity:.85, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1rem', fontWeight:700 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Productos rápidos */}
      <STitle icon="⚡">Venta Rápida</STitle>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:16 }}>
        {prods.map(p => (
          <button
            key={p.id}
            onClick={() => addProd(p)}
            style={{
              background:'white', border:'2px solid var(--cream)', borderRadius:'var(--r)',
              padding:'12px 7px', cursor:'pointer', textAlign:'center',
              transition:'all .2s', boxShadow:'var(--sh)', fontFamily:"'DM Sans',sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--cw)'; e.currentTarget.style.background='var(--cream)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--cream)'; e.currentTarget.style.background='white' }}
          >
            <div style={{ fontSize:'1.4rem', marginBottom:3 }}>{p.emoji || '☕'}</div>
            <div style={{ fontSize:'.68rem', fontWeight:600, color:'var(--cd)', lineHeight:1.2 }}>{p.nombre}</div>
            <div style={{ fontSize:'.68rem', color:'var(--cw)', marginTop:2 }}>$ {fmt(p.precio)}</div>
          </button>
        ))}
      </div>

      {/* Panel pedido + pendiente + cobrar */}
      <Card style={{ marginBottom:16, border:'1px solid var(--cream)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:11 }}>
          <STitle icon="🧾" style={{ margin:0 }}>Pedido Actual</STitle>
          <Btn variant="s" size="sm" onClick={() => { setOrden([]); setCliente('') }}>🗑️</Btn>
        </div>

        {/* Cliente */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:11, background:'var(--latte)', borderRadius:'var(--rs)', padding:'9px 12px' }}>
          <span>👤</span>
          <input
            value={cliente} onChange={e => setCliente(e.target.value)}
            placeholder="Nombre del cliente (opcional)"
            list="clientes-list"
            style={{ flex:1, border:'none', background:'transparent', fontFamily:"'DM Sans',sans-serif", fontSize:'.86rem', color:'var(--cd)', outline:'none' }}
          />
          <datalist id="clientes-list">
            {[...new Set([
              ...store.creditos.map(c => c.cliente),
              ...store.pendientes.map(p => p.cliente).filter(c => c !== 'Sin nombre'),
            ])].map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        {/* Items */}
        <div style={{ maxHeight:200, overflowY:'auto', marginBottom:11 }}>
          {orden.length === 0
            ? <Empty icon="☕" subtitle="Selecciona productos arriba" />
            : orden.map((it, i) => (
              <div key={it.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--cream)', gap:7 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'.85rem', fontWeight:600 }}>{it.emoji} {it.nombre}</div>
                  <div style={{ fontSize:'.73rem', color:'#999' }}>$ {fmt(it.precio)} c/u</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <button onClick={() => chgQty(it.id, -1)} style={{ width:26, height:26, borderRadius:'50%', border:'none', background:'#fee2e2', color:'var(--err)', cursor:'pointer', fontWeight:700, fontSize:'1rem' }}>−</button>
                  <span style={{ fontWeight:700, minWidth:20, textAlign:'center' }}>{it.qty}</span>
                  <button onClick={() => chgQty(it.id, 1)} style={{ width:26, height:26, borderRadius:'50%', border:'none', background:'var(--cream)', color:'var(--cw)', cursor:'pointer', fontWeight:700, fontSize:'1rem' }}>+</button>
                  <span style={{ minWidth:72, textAlign:'right', fontWeight:600, fontSize:'.82rem' }}>$ {fmt((parseFloat(it.precio)||0)*it.qty)}</span>
                </div>
              </div>
            ))}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:11, borderTop:'2px solid var(--cream)', marginBottom:12 }}>
          <span style={{ fontWeight:600 }}>Total Pedido</span>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:700, color:'var(--cw)' }}>$ {fmt(totalOrden)}</span>
        </div>

        {/* ── Botones GUARDAR PENDIENTE + COBRAR junto a la caja ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:12 }}>
          <Btn variant="o" loading={loading} onClick={guardarPendiente}>⏳ Guardar Pendiente</Btn>
          <Btn variant="cobrar" loading={loading} onClick={() => abrirCobrar('orden')} style={{ borderRadius:'var(--r)' }}>💳 Cobrar Pedido</Btn>
        </div>

        {/* ── Registro manual de ventas del día ── */}
        <div style={{ borderTop:'1px dashed #e8d9c8', paddingTop:12 }}>
          <STitle icon="✏️" style={{ fontSize:'.82rem', marginBottom:9 }}>Registrar Venta Manual</STitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:8 }}>
            <div>
              <label style={{ display:'block', fontSize:'.7rem', fontWeight:600, color:'var(--cr)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.5px' }}>Descripción</label>
              <Input value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="Ej: 2 cafés + 1 empanada" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'.7rem', fontWeight:600, color:'var(--cr)', marginBottom:4, textTransform:'uppercase', letterSpacing:'.5px' }}>Monto ($)</label>
              <Input type="number" value={manualMonto} onChange={e => setManualMonto(e.target.value)} placeholder="0" min="0" />
            </div>
          </div>
          <Btn variant="p" full size="sm" loading={loading} onClick={() => abrirCobrar('manual')}>
            ➕ Registrar y Cobrar
          </Btn>
        </div>
      </Card>

      {/* Ventas del día */}
      <STitle icon="📋">Ventas de Hoy</STitle>
      <VentasHoyList store={store} toast={toast} />

      {/* Modal Cobrar */}
      <Modal open={showCobrar} onClose={() => setShowCobrar(false)} title="💳 Cobrar">
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:'.73rem', color:'#888', marginBottom:4 }}>Total a cobrar</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:700, color:'var(--cw)' }}>
            $ {fmt(cobrarMode === 'manual' ? (parseFloat(manualMonto)||0) : totalOrden)}
          </div>
        </div>
        <STitle icon="💳" style={{ fontSize:'.86rem' }}>Método de pago</STitle>
        <PayMethods value={payMethod} onChange={setPayMethod} />
        <FG label="Nota (opcional)">
          <Input value={cobroNota} onChange={e => setCobroNota(e.target.value)} placeholder="Observaciones" />
        </FG>
        <Btn variant="ok" full size="lg" loading={loading} onClick={confirmarCobro}>✅ Confirmar Cobro</Btn>
      </Modal>

      {/* Modal Cierre */}
      {showCierre && <ModalCierreCaja store={store} onClose={() => setShowCierre(false)} />}
    </div>
  )
}

function VentasHoyList({ store, toast }) {
  const today = store.today()
  const ventas = store.transacciones
    .filter(tx => tx.fecha === today && tx.esventa === 'true')
    .sort((a, b) => b.id - a.id)

  if (!ventas.length) return <Empty icon="☕" title="Sin ventas hoy" subtitle="Las ventas aparecerán aquí" />

  return (
    <div style={{ background:'white', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--sh)' }}>
      {ventas.map(v => (
        <div key={v.id} style={{ padding:'12px 15px', borderBottom:'1px solid var(--cream)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, fontSize:'.86rem' }}>{v.concepto}</div>
            <div style={{ fontSize:'.73rem', color:'#888', marginTop:2 }}>{CUENTAS_INFO[v.cuenta]?.label || v.cuenta}</div>
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--ok)' }}>$ {fmt(v.monto)}</div>
          <Btn variant="d" size="sm" onClick={async () => { await store.deleteTx(v.id); toast('Venta eliminada', 'info') }}>🗑️</Btn>
        </div>
      ))}
    </div>
  )
}

function ModalCierreCaja({ store, onClose }) {
  const today = store.today()
  const ventas = store.transacciones.filter(t => t.fecha === today && t.esventa === 'true')
  const totalVentas = ventas.reduce((s, v) => s + Math.abs(parseFloat(v.monto)||0), 0)
  const totalGastos = store.gastos.filter(g => g.fecha === today).reduce((s, g) => s + Math.abs(parseFloat(g.monto)||0), 0)
  const neto = totalVentas - totalGastos
  const porCuenta = {}
  ventas.forEach(v => { porCuenta[v.cuenta] = (porCuenta[v.cuenta]||0) + Math.abs(parseFloat(v.monto)||0) })

  return (
    <Modal open onClose={onClose} title="📊 Cierre de Caja">
      <div style={{ textAlign:'center', marginBottom:18 }}>
        <div style={{ fontSize:'.73rem', color:'#888' }}>{new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2.2rem', fontWeight:700, color:'var(--cw)', margin:'10px 0' }}>$ {fmt(totalVentas)}</div>
        <div style={{ fontSize:'.85rem', color:'#888' }}>{ventas.length} ventas realizadas</div>
      </div>
      <STitle icon="💼" style={{ fontSize:'.86rem' }}>Por método de pago</STitle>
      <div style={{ background:'var(--latte)', borderRadius:'var(--r)', padding:13, marginBottom:14 }}>
        {Object.entries(porCuenta).length === 0
          ? <div style={{ color:'#bbb', textAlign:'center', padding:8, fontSize:'.82rem' }}>Sin ventas hoy</div>
          : Object.entries(porCuenta).map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--cream)' }}>
              <span>{CUENTAS_INFO[k]?.icon} {CUENTAS_INFO[k]?.label || k}</span>
              <strong>$ {fmt(v)}</strong>
            </div>
          ))}
      </div>
      <div style={{ background:'var(--latte)', borderRadius:'var(--r)', padding:13, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--cream)' }}>
          <span>Gastos del día</span><span className="negative">- $ {fmt(totalGastos)}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0' }}>
          <span style={{ fontWeight:600 }}>Neto del día</span>
          <strong style={{ color: neto >= 0 ? 'var(--ok)' : 'var(--err)' }}>{neto >= 0 ? '+' : ''}$ {fmt(neto)}</strong>
        </div>
        {store.totalCreditos() > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderTop:'1px solid var(--cream)' }}>
            <span>Total créditos pendientes</span><span className="negative">$ {fmt(store.totalCreditos())}</span>
          </div>
        )}
      </div>
      <Btn variant="p" full onClick={onClose}>✅ Listo</Btn>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB: PENDIENTES
// ══════════════════════════════════════════════════════════════
function TabPendientes({ store, toast }) {
  const [payMethod, setPayMethod] = useState('efectivo')
  const [cobrando, setCobrando] = useState(null)
  const [loading, setLoading] = useState(false)
  const activos = store.pendientesActivos()

  const cobrar = async () => {
    setLoading(true)
    try {
      await store.cobrarPendiente(cobrando.id, payMethod)
      toast(`✅ $ ${fmt(cobrando.total)} cobrado`, 'success')
      setCobrando(null)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <STitle icon="⏳">Ventas Pendientes de Pago</STitle>
      {activos.length === 0
        ? <Empty icon="⏳" title="Sin pendientes" subtitle="Los pedidos guardados aparecerán aquí" />
        : activos.map(p => (
          <Card key={p.id} style={{ marginBottom:10, borderLeft:'4px solid var(--warn)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'.93rem' }}>👤 {p.cliente}</div>
                <div style={{ fontSize:'.7rem', color:'#bbb', marginTop:2 }}>{fmtDate(p.fecha)} {p.hora}</div>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--cw)', fontSize:'1rem' }}>$ {fmt(p.total)}</div>
            </div>
            <div style={{ fontSize:'.78rem', color:'#888', marginBottom:10 }}>{p.concepto}</div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              <Btn variant="ok" size="sm" onClick={() => setCobrando(p)}>💳 Cobrar</Btn>
              <Btn variant="warn" size="sm" loading={loading} onClick={async () => {
                setLoading(true)
                try { await store.moverACreditoPendiente(p.id); toast(`📋 Movido a crédito`, 'info') }
                catch (e) { toast(e.message, 'error') }
                setLoading(false)
              }}>👤 A Crédito</Btn>
              <Btn variant="d" size="sm" onClick={async () => { await store.deletePendiente(p.id); toast('Pendiente eliminado', 'info') }}>🗑️</Btn>
            </div>
          </Card>
        ))
      }

      <Modal open={!!cobrando} onClose={() => setCobrando(null)} title="💳 Cobrar Pendiente">
        {cobrando && (
          <>
            <div style={{ background:'var(--latte)', borderRadius:'var(--rs)', padding:12, marginBottom:14 }}>
              <div style={{ fontWeight:700 }}>👤 {cobrando.cliente}</div>
              <div style={{ fontSize:'.82rem', color:'#888', marginTop:4 }}>{cobrando.concepto}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', fontWeight:700, color:'var(--cw)', marginTop:6 }}>$ {fmt(cobrando.total)}</div>
            </div>
            <STitle icon="💳" style={{ fontSize:'.86rem' }}>Método de pago</STitle>
            <PayMethods value={payMethod} onChange={setPayMethod} />
            <Btn variant="ok" full size="lg" loading={loading} onClick={cobrar}>✅ Confirmar Cobro</Btn>
          </>
        )}
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB: CRÉDITOS
// ══════════════════════════════════════════════════════════════
function TabCreditos({ store, toast }) {
  const [showNew, setShowNew] = useState(false)
  const [showAbono, setShowAbono] = useState(null)
  const [form, setForm] = useState({ cliente:'', deuda:'', desc:'' })
  const [abForm, setAbForm] = useState({ monto:'', cuenta:'efectivo', nota:'' })
  const [loading, setLoading] = useState(false)
  const totalDeuda = store.totalCreditos()

  const saveNew = async () => {
    if (!form.cliente || !form.deuda) { toast('Completa cliente y monto', 'warning'); return }
    setLoading(true)
    try { await store.addCredito(form); toast('💳 Crédito registrado', 'info'); setShowNew(false); setForm({ cliente:'', deuda:'', desc:'' }) }
    catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const saveAbono = async () => {
    if (!abForm.monto) { toast('Ingresa el monto', 'warning'); return }
    setLoading(true)
    try {
      await store.registrarAbono(showAbono.id, { ...abForm, monto: parseFloat(abForm.monto), clienteNombre: showAbono.cliente })
      toast(`✅ Abono registrado`, 'success')
      setShowAbono(null); setAbForm({ monto:'', cuenta:'efectivo', nota:'' })
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      {totalDeuda > 0 && (
        <div style={{ background:'linear-gradient(135deg,var(--err),#e53935)', borderRadius:'var(--r)', padding:14, color:'white', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'.73rem', opacity:.8, textTransform:'uppercase', letterSpacing:'.5px' }}>Total en Crédito</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', fontWeight:700 }}>$ {fmt(totalDeuda)}</div>
            <div style={{ fontSize:'.8rem', opacity:.8 }}>{store.creditos.filter(c => store.deudaRestante(c) > 0).length} cliente(s) con deuda</div>
          </div>
          <span style={{ fontSize:'2.5rem', opacity:.3 }}>⚠️</span>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <STitle icon="👤" style={{ margin:0 }}>Clientes con Crédito</STitle>
        <Btn variant="p" size="sm" onClick={() => setShowNew(true)}>➕ Nuevo</Btn>
      </div>

      {store.creditos.length === 0
        ? <Empty icon="👤" title="Sin créditos" subtitle="Registra los clientes fiados aquí" />
        : [...store.creditos].sort((a,b) => store.deudaRestante(b) - store.deudaRestante(a)).map(c => {
            const dr = store.deudaRestante(c)
            return (
              <Card key={c.id} style={{ marginBottom:10, borderLeft:`4px solid ${dr > 0 ? 'var(--err)' : 'var(--ok)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ fontWeight:700, fontSize:'.93rem' }}>👤 {c.cliente}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color: dr > 0 ? 'var(--err)' : 'var(--ok)' }}>
                    {dr > 0 ? `$ ${fmt(dr)}` : '✅ Saldado'}
                  </div>
                </div>
                <div style={{ fontSize:'.78rem', color:'#888', marginBottom:4 }}>
                  <strong>Deuda original:</strong> $ {fmt(c.deuda)} {c.desc ? `— ${c.desc}` : ''}
                </div>
                {c.pagos?.length > 0 && (
                  <div style={{ fontSize:'.75rem', color:'#aaa', marginBottom:8 }}>
                    {c.pagos.slice(-2).reverse().map((p, i) => (
                      <div key={i}>{fmtDate(p.fecha)}: +$ {fmt(p.monto)} ({CUENTAS_INFO[p.cuenta]?.label || p.cuenta})</div>
                    ))}
                  </div>
                )}
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  {dr > 0 && <Btn variant="ok" size="sm" onClick={() => { setShowAbono(c); setAbForm({ monto:String(dr), cuenta:'efectivo', nota:'' }) }}>💸 Registrar Abono</Btn>}
                  {dr > 0 && <Btn variant="warn" size="sm" onClick={() => { setShowAbono(c); setAbForm({ monto: String(dr), cuenta:'efectivo', nota:'' }) }}>💰 Cobrar Total</Btn>}
                  <Btn variant="d" size="sm" onClick={async () => { if(confirm('¿Eliminar?')) { await store.deleteCredito(c.id); toast('Eliminado', 'info') } }}>🗑️</Btn>
                </div>
              </Card>
            )
          })
      }

      <Modal open={showNew} onClose={() => setShowNew(false)} title="💳 Nuevo Crédito">
        <FG label="Cliente"><Input value={form.cliente} onChange={e => setForm(f => ({...f, cliente:e.target.value}))} placeholder="Nombre del cliente" /></FG>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
          <FG label="Monto ($)"><Input type="number" value={form.deuda} onChange={e => setForm(f => ({...f, deuda:e.target.value}))} placeholder="0" /></FG>
          <FG label="Concepto"><Input value={form.desc} onChange={e => setForm(f => ({...f, desc:e.target.value}))} placeholder="Ej: Almuerzo" /></FG>
        </div>
        <div style={{ display:'flex', gap:9, justifyContent:'flex-end', marginTop:4 }}>
          <Btn variant="s" onClick={() => setShowNew(false)}>Cancelar</Btn>
          <Btn variant="p" loading={loading} onClick={saveNew}>Guardar</Btn>
        </div>
      </Modal>

      <Modal open={!!showAbono} onClose={() => setShowAbono(null)} title="💸 Registrar Abono">
        {showAbono && (
          <>
            <div style={{ background:'var(--latte)', borderRadius:'var(--rs)', padding:12, marginBottom:14 }}>
              <strong>{showAbono.cliente}</strong>
              <div style={{ color:'var(--err)', fontSize:'.85rem' }}>Deuda restante: $ {fmt(store.deudaRestante(showAbono))}</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
              <FG label="Monto ($)"><Input type="number" value={abForm.monto} onChange={e => setAbForm(f => ({...f, monto:e.target.value}))} /></FG>
              <FG label="Método de pago">
                <Select value={abForm.cuenta} onChange={e => setAbForm(f => ({...f, cuenta:e.target.value}))}>
                  {Object.entries(CUENTAS_INFO).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </Select>
              </FG>
            </div>
            <FG label="Nota"><Input value={abForm.nota} onChange={e => setAbForm(f => ({...f, nota:e.target.value}))} placeholder="Observaciones" /></FG>
            <Btn variant="ok" full loading={loading} onClick={saveAbono}>✅ Registrar Abono</Btn>
          </>
        )}
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB: GASTOS
// ══════════════════════════════════════════════════════════════
function TabGastos({ store, toast }) {
  const [showModal, setShowModal] = useState(false)
  const [editGasto, setEditGasto] = useState(null)
  const [form, setForm] = useState({ concepto:'', monto:'', categoria:'Insumos', cuenta:'efectivo', nota:'' })
  const [loading, setLoading] = useState(false)
  const today = store.today()
  const thisMonth = today.slice(0, 7)

  const totalHoy = store.gastos.filter(g => g.fecha === today).reduce((s,g) => s + Math.abs(parseFloat(g.monto)||0), 0)
  const totalMes = store.gastos.filter(g => g.fecha?.startsWith(thisMonth)).reduce((s,g) => s + Math.abs(parseFloat(g.monto)||0), 0)

  const openNew = () => { setEditGasto(null); setForm({ concepto:'', monto:'', categoria:'Insumos', cuenta:'efectivo', nota:'', fecha: today }); setShowModal(true) }
  const openEdit = (g) => { setEditGasto(g); setForm({ ...g }); setShowModal(true) }

  const save = async () => {
    if (!form.concepto || !form.monto) { toast('Completa concepto y monto', 'warning'); return }
    setLoading(true)
    try {
      await store.addGasto({ ...form, fecha: form.fecha || today })
      toast('✅ Gasto registrado', 'success')
      setShowModal(false)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const CATS = ['Insumos','Transporte','Servicios','Personal','Mantenimiento','Otros']

  return (
    <div className="animate-fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <STitle icon="📋" style={{ margin:0 }}>Gastos</STitle>
        <Btn variant="d" size="sm" onClick={openNew}>➕ Nuevo Gasto</Btn>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:14 }}>
        <Card style={{ textAlign:'center', padding:13 }}>
          <div style={{ fontSize:'.68rem', color:'#888', textTransform:'uppercase', marginBottom:5 }}>Total Hoy</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1rem', fontWeight:700, color:'var(--err)' }}>$ {fmt(totalHoy)}</div>
        </Card>
        <Card style={{ textAlign:'center', padding:13 }}>
          <div style={{ fontSize:'.68rem', color:'#888', textTransform:'uppercase', marginBottom:5 }}>Este Mes</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1rem', fontWeight:700, color:'var(--err)' }}>$ {fmt(totalMes)}</div>
        </Card>
        <Card style={{ textAlign:'center', padding:13 }}>
          <div style={{ fontSize:'.68rem', color:'#888', textTransform:'uppercase', marginBottom:5 }}>Total</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1rem', fontWeight:700 }}>{store.gastos.length}</div>
        </Card>
      </div>

      {store.gastos.length === 0
        ? <Empty icon="📋" title="Sin gastos" subtitle="Registra gastos del negocio aquí" />
        : [...store.gastos].sort((a,b) => b.id - a.id).map(g => (
          <Card key={g.id} style={{ marginBottom:9, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:'.88rem' }}>{g.concepto}</div>
              <div style={{ fontSize:'.73rem', color:'#888', marginTop:2 }}>
                {fmtDate(g.fecha)} · {g.categoria} · {CUENTAS_INFO[g.cuenta]?.label || g.cuenta}
                {g.nota && ` · ${g.nota}`}
              </div>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--err)' }}>-$ {fmt(g.monto)}</div>
            <div style={{ display:'flex', gap:6 }}>
              <Btn variant="d" size="sm" onClick={async () => { if(confirm('¿Eliminar?')) { await store.deleteGasto(g.id); toast('Eliminado','info') } }}>🗑️</Btn>
            </div>
          </Card>
        ))
      }

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editGasto ? 'Editar Gasto' : 'Nuevo Gasto'}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
          <FG label="Concepto"><Input value={form.concepto} onChange={e => setForm(f => ({...f, concepto:e.target.value}))} placeholder="Ej: Insumos café" /></FG>
          <FG label="Monto ($)"><Input type="number" value={form.monto} onChange={e => setForm(f => ({...f, monto:e.target.value}))} placeholder="0" /></FG>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
          <FG label="Categoría">
            <Select value={form.categoria} onChange={e => setForm(f => ({...f, categoria:e.target.value}))}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </Select>
          </FG>
          <FG label="Cuenta">
            <Select value={form.cuenta} onChange={e => setForm(f => ({...f, cuenta:e.target.value}))}>
              {Object.entries(CUENTAS_INFO).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </Select>
          </FG>
        </div>
        <FG label="Fecha"><Input type="date" value={form.fecha || today} onChange={e => setForm(f => ({...f, fecha:e.target.value}))} /></FG>
        <FG label="Nota"><Input value={form.nota} onChange={e => setForm(f => ({...f, nota:e.target.value}))} placeholder="Observaciones" /></FG>
        <div style={{ display:'flex', gap:9, justifyContent:'flex-end' }}>
          <Btn variant="s" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn variant="p" loading={loading} onClick={save}>Guardar</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB: RESUMEN
// ══════════════════════════════════════════════════════════════
function TabResumen({ store, toast }) {
  const balance = store.balancePorCuenta()
  const total = Object.values(balance).reduce((a,b) => a+b, 0)

  return (
    <div className="animate-fade-in">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:11, marginBottom:16 }}>
        {Object.entries(CUENTAS_INFO).map(([key, info]) => {
          const bal = balance[key] || 0
          return (
            <Card key={key} style={{ borderTop:`4px solid ${info.borderColor}` }}>
              <div style={{ width:30, height:30, borderRadius:7, background:info.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:9, fontSize:'.95rem' }}>{info.icon}</div>
              <div style={{ fontSize:'.72rem', fontWeight:600, color:'#777', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{info.label}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.1rem', fontWeight:700, color: bal >= 0 ? 'var(--ok)' : 'var(--err)' }}>$ {fmt(bal)}</div>
            </Card>
          )
        })}
      </div>
      <Card>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'.72rem', color:'#888', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>Total General</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:700, color: total >= 0 ? 'var(--ok)' : 'var(--err)' }}>$ {fmt(total)}</div>
        </div>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB: MOVIMIENTOS
// ══════════════════════════════════════════════════════════════
function TabMovimientos({ store, toast }) {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [showAll, setShowAll] = useState(false)
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const filtered = store.transacciones.filter(tx => {
    if (showAll) return true
    const [y, m] = (tx.fecha || '').split('-')
    return parseInt(y) === year && parseInt(m) - 1 === month
  })

  const income = filtered.filter(t => parseFloat(t.monto) > 0).reduce((s,t) => s + parseFloat(t.monto), 0)
  const expense = filtered.filter(t => parseFloat(t.monto) < 0).reduce((s,t) => s + Math.abs(parseFloat(t.monto)), 0)

  const prevMonth = () => { if(month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if(month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  return (
    <div className="animate-fade-in">
      <div style={{ background:'white', borderRadius:'var(--r)', padding:'12px 15px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'var(--sh)', marginBottom:13, flexWrap:'wrap', gap:9 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <button onClick={prevMonth} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--cream)', color:'var(--cw)', cursor:'pointer' }}>‹</button>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:600 }}>{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--cream)', color:'var(--cw)', cursor:'pointer' }}>›</button>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['current','all'].map(f => (
            <button key={f} onClick={() => setShowAll(f==='all')} style={{ padding:'5px 13px', borderRadius:20, border:`1.5px solid ${(!showAll && f==='current') || (showAll && f==='all') ? 'var(--cw)' : 'var(--cream)'}`, background: (!showAll && f==='current') || (showAll && f==='all') ? 'var(--cw)' : 'transparent', color: (!showAll && f==='current') || (showAll && f==='all') ? 'white' : 'var(--cd)', cursor:'pointer', fontSize:'.75rem', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
              {f === 'current' ? 'Este mes' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {!showAll && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9, marginBottom:13 }}>
          {[{l:'Neto', v:income-expense, c:income-expense>=0?'var(--ok)':'var(--err)'}, {l:'Ingresos', v:income, c:'var(--ok)'}, {l:'Egresos', v:expense, c:'var(--err)'}].map(s => (
            <Card key={s.l} style={{ textAlign:'center', padding:13 }}>
              <div style={{ fontSize:'.68rem', color:'#888', textTransform:'uppercase', marginBottom:5 }}>{s.l}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:s.c }}>$ {fmt(s.v)}</div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0
        ? <Empty icon="📜" title="Sin movimientos" subtitle={showAll ? 'No hay registros' : 'Sin movimientos este mes'} />
        : (
          <div style={{ background:'white', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--sh)' }}>
            {[...filtered].sort((a,b) => b.id - a.id).map(tx => (
              <div key={tx.id} style={{ padding:'12px 15px', borderBottom:'1px solid var(--cream)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'.86rem' }}>{tx.concepto}</div>
                  <div style={{ fontSize:'.72rem', color:'#888', marginTop:2 }}>{fmtDate(tx.fecha)} · {CUENTAS_INFO[tx.cuenta]?.label || tx.cuenta}</div>
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color: parseFloat(tx.monto) >= 0 ? 'var(--ok)' : 'var(--err)' }}>
                  {parseFloat(tx.monto) >= 0 ? '+' : ''}$ {fmt(tx.monto)}
                </div>
                <Btn variant="d" size="sm" onClick={async () => { if(confirm('¿Eliminar?')) { await store.deleteTx(tx.id); toast('Eliminado','info') } }}>🗑️</Btn>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB: GASTOS FIJOS
// ══════════════════════════════════════════════════════════════
function TabGastosFijos({ store, toast }) {
  const [showModal, setShowModal] = useState(false)
  const [editFE, setEditFE] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nombre:'', monto:'', dia:'', cuenta:'', categoria:'' })
  const today = store.today()
  const thisMonth = today.slice(0,7)
  const curDay = new Date().getDate()
  const curMY = `${new Date().getFullYear()}-${new Date().getMonth()+1}`

  const isPaid = (fe) => {
    if (!fe.ultimoPago) return false
    const [y,m] = fe.ultimoPago.split('-')
    return `${y}-${parseInt(m)}` === curMY
  }

  const pending = store.gastosFijos.filter(fe => fe.activo !== 'false' && !isPaid(fe))
  const totalPending = pending.reduce((s,fe) => s + Math.abs(parseFloat(fe.monto)||0), 0)

  const openNew = () => { setEditFE(null); setForm({ nombre:'', monto:'', dia:'', cuenta:'', categoria:'' }); setShowModal(true) }
  const openEdit = (fe) => { setEditFE(fe); setForm({ ...fe }); setShowModal(true) }

  const save = async () => {
    if (!form.nombre || !form.monto || !form.dia) { toast('Completa nombre, monto y día', 'warning'); return }
    setLoading(true)
    try {
      if (editFE) await store.updateGastoFijo(editFE.id, { ...editFE, ...form })
      else await store.addGastoFijo({ ...form, activo: 'true', ultimoPago:'', creadoEn: today })
      toast(editFE ? '✅ Actualizado' : '📅 Gasto fijo añadido', 'success')
      setShowModal(false)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const pagar = async (fe) => {
    setLoading(true)
    try { await store.pagarGastoFijo(fe); toast(`✅ ${fe.nombre} pagado`, 'success') }
    catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  const CATS = ['Arriendo','Servicios','Insumos','Nómina','Internet','Otros']

  return (
    <div className="animate-fade-in">
      {pending.length > 0 && (
        <div style={{ background:'#fff3cd', border:'1px solid #f0c060', borderRadius:'var(--r)', padding:'13px 15px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:9 }}>
          <div>
            <strong>⚠️ {pending.length} gasto(s) pendiente(s)</strong>
            <div style={{ fontSize:'.83rem', marginTop:3 }}>Total: <span className="negative">$ {fmt(totalPending)}</span></div>
          </div>
          <Btn variant="p" size="sm" loading={loading} onClick={async () => {
            setLoading(true)
            try { for(const fe of pending) await store.pagarGastoFijo(fe); toast(`✅ ${pending.length} gastos pagados`, 'success') }
            catch(e) { toast(e.message,'error') }
            setLoading(false)
          }}>💸 Pagar Todos</Btn>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <STitle icon="📅" style={{ margin:0 }}>Gastos Fijos Mensuales</STitle>
        <Btn variant="p" size="sm" onClick={openNew}>➕ Nuevo</Btn>
      </div>

      {store.gastosFijos.length === 0
        ? <Empty icon="📅" title="Sin gastos fijos" subtitle="Agrega tus gastos recurrentes" />
        : store.gastosFijos.map(fe => {
          const paid = isPaid(fe)
          const rem = parseInt(fe.dia) - curDay
          let statusTxt = paid ? `Pagado ${fmtDate(fe.ultimoPago)}` : rem < 0 ? `Vencido hace ${Math.abs(rem)}d` : rem === 0 ? 'Vence hoy' : `Vence en ${rem}d`
          let statusColor = paid ? 'var(--ok)' : rem <= 0 ? 'var(--err)' : 'var(--warn)'

          return (
            <Card key={fe.id} style={{ marginBottom:10, borderLeft:`4px solid ${statusColor}`, opacity: fe.activo === 'false' ? .6 : 1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <div style={{ fontWeight:700, fontSize:'.93rem' }}>{fe.nombre}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:'var(--cw)' }}>$ {fmt(fe.monto)}</div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.78rem', color:'#888', marginBottom:9 }}>
                <span>📅 Día {fe.dia}{fe.categoria ? ` · ${fe.categoria}` : ''}</span>
                <span style={{ color:statusColor, fontWeight:600 }}>{statusTxt}</span>
              </div>
              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                <Btn variant="s" size="sm" onClick={() => openEdit(fe)}>✏️ Editar</Btn>
                {!paid && fe.activo !== 'false' && <Btn variant="ok" size="sm" loading={loading} onClick={() => pagar(fe)}>✅ Pagar</Btn>}
                {paid && <span style={{ fontSize:'.72rem', padding:'3px 10px', borderRadius:10, background:'#e8f5e9', color:'var(--ok)', fontWeight:600 }}>✅ Pagado</span>}
                <Btn variant="d" size="sm" onClick={async () => { if(confirm('¿Eliminar?')) { await store.deleteGastoFijo(fe.id); toast('Eliminado','info') } }}>🗑️</Btn>
              </div>
            </Card>
          )
        })
      }

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editFE ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
          <FG label="Nombre"><Input value={form.nombre} onChange={e => setForm(f => ({...f, nombre:e.target.value}))} placeholder="Arriendo local" /></FG>
          <FG label="Monto ($)"><Input type="number" value={form.monto} onChange={e => setForm(f => ({...f, monto:e.target.value}))} placeholder="0" /></FG>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
          <FG label="Día del mes"><Input type="number" value={form.dia} onChange={e => setForm(f => ({...f, dia:e.target.value}))} placeholder="1-31" min="1" max="31" /></FG>
          <FG label="Cuenta">
            <Select value={form.cuenta} onChange={e => setForm(f => ({...f, cuenta:e.target.value}))}>
              <option value="">Sin especificar</option>
              {Object.entries(CUENTAS_INFO).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </Select>
          </FG>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
          <FG label="Categoría">
            <Select value={form.categoria} onChange={e => setForm(f => ({...f, categoria:e.target.value}))}>
              <option value="">Sin categoría</option>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </Select>
          </FG>
          <FG label="Estado">
            <Select value={form.activo} onChange={e => setForm(f => ({...f, activo:e.target.value}))}>
              <option value="true">✅ Activo</option>
              <option value="false">⏸ Inactivo</option>
            </Select>
          </FG>
        </div>
        <div style={{ display:'flex', gap:9, justifyContent:'flex-end' }}>
          <Btn variant="s" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn variant="p" loading={loading} onClick={save}>Guardar</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB: PRODUCTOS
// ══════════════════════════════════════════════════════════════
function TabProductos({ store, toast }) {
  const [showModal, setShowModal] = useState(false)
  const [editProd, setEditProd] = useState(null)
  const [form, setForm] = useState({ nombre:'', precio:'', emoji:'☕' })
  const [loading, setLoading] = useState(false)

  const openNew = () => { setEditProd(null); setForm({ nombre:'', precio:'', emoji:'☕' }); setShowModal(true) }
  const openEdit = (p) => { setEditProd(p); setForm({ ...p }); setShowModal(true) }

  const save = async () => {
    if (!form.nombre || !form.precio) { toast('Completa nombre y precio', 'warning'); return }
    setLoading(true)
    try {
      if (editProd) await store.updateProducto(editProd.id, { ...editProd, ...form })
      else await store.addProducto({ ...form, activo: 'true', orden: String(store.productos.length + 1) })
      toast(editProd ? '✅ Actualizado' : '✅ Producto añadido', 'success')
      setShowModal(false)
    } catch (e) { toast(e.message, 'error') }
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <STitle icon="☕" style={{ margin:0 }}>Catálogo de Productos</STitle>
        <Btn variant="p" size="sm" onClick={openNew}>➕ Nuevo</Btn>
      </div>

      {store.productos.length === 0
        ? <Empty icon="☕" title="Sin productos" />
        : store.productos.map(p => (
          <Card key={p.id} style={{ marginBottom:9, display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft:'4px solid var(--cw)', opacity: p.activo === 'false' ? .5 : 1 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:'.88rem' }}>{p.emoji || '☕'} {p.nombre}</div>
              <div style={{ fontSize:'.78rem', color:'#888' }}>$ {fmt(p.precio)}</div>
            </div>
            <div style={{ display:'flex', gap:7 }}>
              <Btn variant="s" size="sm" onClick={() => openEdit(p)}>✏️</Btn>
              <Btn variant="d" size="sm" onClick={async () => { if(confirm('¿Eliminar?')) { await store.deleteProducto(p.id); toast('Eliminado','info') } }}>🗑️</Btn>
            </div>
          </Card>
        ))
      }

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProd ? 'Editar Producto' : 'Nuevo Producto'}>
        <div style={{ display:'grid', gridTemplateColumns:'80px 1fr', gap:13 }}>
          <FG label="Emoji"><Input value={form.emoji} onChange={e => setForm(f => ({...f, emoji:e.target.value}))} placeholder="☕" maxLength={4} /></FG>
          <FG label="Nombre"><Input value={form.nombre} onChange={e => setForm(f => ({...f, nombre:e.target.value}))} placeholder="Café Americano" /></FG>
        </div>
        <FG label="Precio ($)"><Input type="number" value={form.precio} onChange={e => setForm(f => ({...f, precio:e.target.value}))} placeholder="0" /></FG>
        <FG label="Estado">
          <Select value={form.activo || 'true'} onChange={e => setForm(f => ({...f, activo:e.target.value}))}>
            <option value="true">✅ Activo</option>
            <option value="false">⏸ Inactivo</option>
          </Select>
        </FG>
        <div style={{ display:'flex', gap:9, justifyContent:'flex-end' }}>
          <Btn variant="s" onClick={() => setShowModal(false)}>Cancelar</Btn>
          {editProd && <Btn variant="d" size="sm" loading={loading} onClick={async () => { await store.deleteProducto(editProd.id); toast('Eliminado','info'); setShowModal(false) }}>🗑️</Btn>}
          <Btn variant="p" loading={loading} onClick={save}>Guardar</Btn>
        </div>
      </Modal>
    </div>
  )
}
