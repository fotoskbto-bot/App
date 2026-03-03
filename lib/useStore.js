// lib/useStore.js
import { useState, useCallback } from 'react'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function now() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function uid() { return Date.now().toString() }

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(path, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Error ${res.status}`)
  }
  return res.json()
}

export function useStore() {
  const [state, setState] = useState({
    transacciones: [],
    gastos: [],
    gastosFijos: [],
    pendientes: [],
    creditos: [],
    productos: [],
    loading: true,
    error: null,
  })

  const load = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }))
      const data = await api('/api/data')
      setState(s => ({ ...s, ...data, loading: false }))
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message }))
    }
  }, [])

  // ── Transacciones ──────────────────────────────────────────
  const addTx = useCallback(async (data) => {
    const row = await api('/api/transacciones', 'POST', { id: uid(), ...data })
    setState(s => ({ ...s, transacciones: [...s.transacciones, row] }))
    return row
  }, [])

  const deleteTx = useCallback(async (id) => {
    await api(`/api/transacciones?id=${id}`, 'DELETE')
    setState(s => ({ ...s, transacciones: s.transacciones.filter(t => t.id !== id) }))
  }, [])

  // ── Ventas (transacciones de tipo venta) ───────────────────
  const registrarVenta = useCallback(async ({ concepto, monto, cuenta, cliente }) => {
    return addTx({
      fecha: today(),
      concepto,
      monto: String(monto),
      tipo: 'ingreso',
      cuenta,
      esventa: 'true',
      cliente: cliente || '',
      gastoFijoId: '',
    })
  }, [addTx])

  // ── Gastos ─────────────────────────────────────────────────
  const addGasto = useCallback(async (data) => {
    const row = await api('/api/gastos', 'POST', { id: uid(), ...data })
    // Also create negative tx in account
    await addTx({
      fecha: data.fecha || today(),
      concepto: `[Gasto] ${data.concepto}${data.nota ? ' — ' + data.nota : ''}`,
      monto: String(-Math.abs(parseFloat(data.monto))),
      tipo: 'egreso',
      cuenta: data.cuenta,
      esventa: 'false',
      cliente: '',
      gastoFijoId: '',
    })
    setState(s => ({ ...s, gastos: [...s.gastos, row] }))
    return row
  }, [addTx])

  const deleteGasto = useCallback(async (id) => {
    await api(`/api/gastos?id=${id}`, 'DELETE')
    setState(s => ({ ...s, gastos: s.gastos.filter(g => g.id !== id) }))
  }, [])

  // ── Gastos Fijos ───────────────────────────────────────────
  const addGastoFijo = useCallback(async (data) => {
    const row = await api('/api/gastos-fijos', 'POST', { id: uid(), creadoEn: today(), activo: 'true', ...data })
    setState(s => ({ ...s, gastosFijos: [...s.gastosFijos, row] }))
    return row
  }, [])

  const updateGastoFijo = useCallback(async (id, data) => {
    await api('/api/gastos-fijos', 'PUT', { id, ...data })
    setState(s => ({ ...s, gastosFijos: s.gastosFijos.map(f => f.id === id ? { ...f, ...data } : f) }))
  }, [])

  const deleteGastoFijo = useCallback(async (id) => {
    await api(`/api/gastos-fijos?id=${id}`, 'DELETE')
    setState(s => ({ ...s, gastosFijos: s.gastosFijos.filter(f => f.id !== id) }))
  }, [])

  const pagarGastoFijo = useCallback(async (fe) => {
    const fecha = today()
    await updateGastoFijo(fe.id, { ...fe, ultimoPago: fecha })
    return addTx({
      fecha,
      concepto: `[GF] ${fe.nombre}`,
      monto: String(-Math.abs(parseFloat(fe.monto))),
      tipo: 'egreso',
      cuenta: fe.cuenta || 'efectivo',
      esventa: 'false',
      cliente: '',
      gastoFijoId: fe.id,
    })
  }, [updateGastoFijo, addTx])

  // ── Pendientes ─────────────────────────────────────────────
  const addPendiente = useCallback(async (data) => {
    const row = await api('/api/pendientes', 'POST', {
      id: uid(),
      fecha: today(),
      hora: now(),
      estado: 'pendiente',
      ...data,
    })
    setState(s => ({ ...s, pendientes: [...s.pendientes, row] }))
    return row
  }, [])

  const cobrarPendiente = useCallback(async (pendId, cuenta) => {
    const pend = state.pendientes.find(p => p.id === pendId)
    if (!pend) return
    await api(`/api/pendientes?id=${pendId}`, 'DELETE')
    const tx = await registrarVenta({
      concepto: `[P] ${pend.cliente} — ${pend.concepto}`,
      monto: pend.total,
      cuenta,
      cliente: pend.cliente,
    })
    setState(s => ({ ...s, pendientes: s.pendientes.filter(p => p.id !== pendId) }))
    return tx
  }, [state.pendientes, registrarVenta])

  const moverACreditoPendiente = useCallback(async (pendId) => {
    const pend = state.pendientes.find(p => p.id === pendId)
    if (!pend) return
    await api(`/api/pendientes?id=${pendId}`, 'DELETE')
    const cred = await api('/api/creditos', 'POST', {
      id: uid(),
      cliente: pend.cliente,
      deuda: pend.total,
      desc: pend.concepto,
      fecha: today(),
    })
    setState(s => ({
      ...s,
      pendientes: s.pendientes.filter(p => p.id !== pendId),
      creditos: [...s.creditos, { ...cred, deuda: parseFloat(cred.deuda), pagos: [] }],
    }))
    return cred
  }, [state.pendientes])

  const deletePendiente = useCallback(async (id) => {
    await api(`/api/pendientes?id=${id}`, 'DELETE')
    setState(s => ({ ...s, pendientes: s.pendientes.filter(p => p.id !== id) }))
  }, [])

  // ── Créditos ───────────────────────────────────────────────
  const addCredito = useCallback(async (data) => {
    const row = await api('/api/creditos', 'POST', { id: uid(), fecha: today(), ...data })
    setState(s => ({ ...s, creditos: [...s.creditos, { ...row, deuda: parseFloat(row.deuda), pagos: [] }] }))
    return row
  }, [])

  const registrarAbono = useCallback(async (creditoId, { monto, cuenta, nota, clienteNombre }) => {
    const abono = await api('/api/creditos', 'POST', {
      tipo: 'abono',
      id: uid(),
      creditoId,
      monto: String(monto),
      cuenta,
      fecha: today(),
      nota: nota || '',
      clienteNombre: clienteNombre || '',
    })
    setState(s => ({
      ...s,
      creditos: s.creditos.map(c =>
        c.id === creditoId
          ? { ...c, pagos: [...(c.pagos || []), { ...abono, monto: parseFloat(abono.monto) }] }
          : c
      ),
      transacciones: [...s.transacciones, {
        id: uid(), fecha: today(),
        concepto: `Abono crédito — ${clienteNombre}`,
        monto: String(monto), tipo: 'ingreso', cuenta, esventa: 'false',
      }],
    }))
    return abono
  }, [])

  const deleteCredito = useCallback(async (id) => {
    await api(`/api/creditos?id=${id}`, 'DELETE')
    setState(s => ({ ...s, creditos: s.creditos.filter(c => c.id !== id) }))
  }, [])

  // ── Productos ──────────────────────────────────────────────
  const addProducto = useCallback(async (data) => {
    const row = await api('/api/productos', 'POST', { id: uid(), activo: 'true', ...data })
    setState(s => ({ ...s, productos: [...s.productos, row] }))
    return row
  }, [])

  const updateProducto = useCallback(async (id, data) => {
    await api('/api/productos', 'PUT', { id, ...data })
    setState(s => ({ ...s, productos: s.productos.map(p => p.id === id ? { ...p, ...data } : p) }))
  }, [])

  const deleteProducto = useCallback(async (id) => {
    await api(`/api/productos?id=${id}`, 'DELETE')
    setState(s => ({ ...s, productos: s.productos.filter(p => p.id !== id) }))
  }, [])

  // ── Computed helpers ───────────────────────────────────────
  function ventasHoy() {
    const t = today()
    return state.transacciones
      .filter(tx => tx.fecha === t && tx.esventa === 'true')
      .reduce((s, tx) => s + Math.abs(parseFloat(tx.monto) || 0), 0)
  }

  function gastosHoy() {
    const t = today()
    return state.gastos
      .filter(g => g.fecha === t)
      .reduce((s, g) => s + Math.abs(parseFloat(g.monto) || 0), 0)
  }

  function txHoy() {
    const t = today()
    return state.transacciones.filter(tx => tx.fecha === t && tx.esventa === 'true').length
  }

  function balancePorCuenta() {
    const cuentas = { efectivo: 0, nequi: 0, bancolombia: 0, daviplata: 0 }
    state.transacciones.forEach(tx => {
      const m = parseFloat(tx.monto) || 0
      if (cuentas[tx.cuenta] !== undefined) cuentas[tx.cuenta] += m
    })
    return cuentas
  }

  function deudaRestante(credito) {
    const pagos = (credito.pagos || []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0)
    return (parseFloat(credito.deuda) || 0) - pagos
  }

  function totalCreditos() {
    return state.creditos.reduce((s, c) => s + deudaRestante(c), 0)
  }

  function pendientesActivos() {
    return state.pendientes.filter(p => p.estado !== 'cobrado')
  }

  return {
    ...state,
    load,
    // actions
    addTx, deleteTx,
    registrarVenta,
    addGasto, deleteGasto,
    addGastoFijo, updateGastoFijo, deleteGastoFijo, pagarGastoFijo,
    addPendiente, cobrarPendiente, moverACreditoPendiente, deletePendiente,
    addCredito, registrarAbono, deleteCredito,
    addProducto, updateProducto, deleteProducto,
    // computed
    ventasHoy, gastosHoy, txHoy, balancePorCuenta, deudaRestante, totalCreditos, pendientesActivos,
    today,
  }
}
