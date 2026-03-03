// lib/sheets.js
// ─────────────────────────────────────────────────────────────
// Capa de datos: todas las operaciones con Google Sheets
// ─────────────────────────────────────────────────────────────
import { google } from 'googleapis'

const SHEET_ID = process.env.GOOGLE_SHEET_ID

// Hojas (tabs) del spreadsheet
export const SHEETS = {
  TRANSACCIONES: 'Transacciones',
  GASTOS:        'Gastos',
  GASTOS_FIJOS:  'GastosFijos',
  PENDIENTES:    'Pendientes',
  CREDITOS:      'Creditos',
  ABONOS:        'Abonos',
  PRODUCTOS:     'Productos',
}

// ── Auth ──────────────────────────────────────────────────────
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY no configurada')
  const key = typeof raw === 'string' ? JSON.parse(raw) : raw
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getSheets() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

// ── Helpers ───────────────────────────────────────────────────
function rowToObj(headers, row) {
  const obj = {}
  headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
  return obj
}

async function readSheet(sheetsApi, sheetName) {
  try {
    const res = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:Z`,
    })
    const rows = res.data.values || []
    if (rows.length < 1) return []
    const headers = rows[0]
    return rows.slice(1).map(r => rowToObj(headers, r)).filter(r => r.id)
  } catch {
    return []
  }
}

async function appendRow(sheetsApi, sheetName, headers, rowObj) {
  const row = headers.map(h => rowObj[h] ?? '')
  await sheetsApi.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}

async function updateRow(sheetsApi, sheetName, id, headers, rowObj) {
  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`,
  })
  const ids = (res.data.values || []).flat()
  const rowIndex = ids.indexOf(String(id))
  if (rowIndex === -1) return false
  const row = headers.map(h => rowObj[h] ?? '')
  await sheetsApi.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowIndex + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
  return true
}

async function deleteRow(sheetsApi, sheetName, id) {
  // Get sheet metadata to find sheetId
  const meta = await sheetsApi.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const sheet = meta.data.sheets.find(s => s.properties.title === sheetName)
  if (!sheet) return false

  const res = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`,
  })
  const ids = (res.data.values || []).flat()
  const rowIndex = ids.indexOf(String(id))
  if (rowIndex === -1) return false

  await sheetsApi.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    },
  })
  return true
}

// ── Init: crear hojas y cabeceras si no existen ───────────────
export async function initSheets() {
  const sheetsApi = await getSheets()
  const meta = await sheetsApi.spreadsheets.get({ spreadsheetId: SHEET_ID })
  const existing = meta.data.sheets.map(s => s.properties.title)

  const schemasMap = {
    [SHEETS.TRANSACCIONES]: ['id','fecha','concepto','monto','tipo','cuenta','esventa','cliente','gastoFijoId'],
    [SHEETS.GASTOS]:        ['id','fecha','concepto','monto','categoria','cuenta','nota'],
    [SHEETS.GASTOS_FIJOS]:  ['id','nombre','monto','dia','cuenta','categoria','activo','ultimoPago','creadoEn'],
    [SHEETS.PENDIENTES]:    ['id','cliente','concepto','total','items','fecha','hora','estado'],
    [SHEETS.CREDITOS]:      ['id','cliente','deuda','desc','fecha'],
    [SHEETS.ABONOS]:        ['id','creditoId','monto','cuenta','fecha','nota'],
    [SHEETS.PRODUCTOS]:     ['id','nombre','precio','emoji','activo','orden'],
  }

  const requests = []
  for (const [name] of Object.entries(schemasMap)) {
    if (!existing.includes(name)) {
      requests.push({ addSheet: { properties: { title: name } } })
    }
  }

  if (requests.length > 0) {
    await sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests },
    })
  }

  // Write headers if sheet is empty
  for (const [name, headers] of Object.entries(schemasMap)) {
    const check = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${name}!A1`,
    })
    if (!check.data.values) {
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${name}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      })
    }
  }

  return { ok: true }
}

// ══════════════════════════════════════════════════════════════
// TRANSACCIONES
// ══════════════════════════════════════════════════════════════
const TX_HEADERS = ['id','fecha','concepto','monto','tipo','cuenta','esventa','cliente','gastoFijoId']

export async function getTx() {
  const s = await getSheets()
  return readSheet(s, SHEETS.TRANSACCIONES)
}

export async function addTx(data) {
  const s = await getSheets()
  const row = { ...data, id: data.id || Date.now().toString() }
  await appendRow(s, SHEETS.TRANSACCIONES, TX_HEADERS, row)
  return row
}

export async function deleteTx(id) {
  const s = await getSheets()
  return deleteRow(s, SHEETS.TRANSACCIONES, id)
}

export async function updateTx(id, data) {
  const s = await getSheets()
  return updateRow(s, SHEETS.TRANSACCIONES, id, TX_HEADERS, data)
}

// ══════════════════════════════════════════════════════════════
// GASTOS NO FIJOS
// ══════════════════════════════════════════════════════════════
const GASTO_HEADERS = ['id','fecha','concepto','monto','categoria','cuenta','nota']

export async function getGastos() {
  const s = await getSheets()
  return readSheet(s, SHEETS.GASTOS)
}

export async function addGasto(data) {
  const s = await getSheets()
  const row = { ...data, id: data.id || Date.now().toString() }
  await appendRow(s, SHEETS.GASTOS, GASTO_HEADERS, row)
  return row
}

export async function deleteGasto(id) {
  const s = await getSheets()
  return deleteRow(s, SHEETS.GASTOS, id)
}

export async function updateGasto(id, data) {
  const s = await getSheets()
  return updateRow(s, SHEETS.GASTOS, id, GASTO_HEADERS, data)
}

// ══════════════════════════════════════════════════════════════
// GASTOS FIJOS
// ══════════════════════════════════════════════════════════════
const FE_HEADERS = ['id','nombre','monto','dia','cuenta','categoria','activo','ultimoPago','creadoEn']

export async function getGastosFijos() {
  const s = await getSheets()
  return readSheet(s, SHEETS.GASTOS_FIJOS)
}

export async function addGastoFijo(data) {
  const s = await getSheets()
  const row = { ...data, id: data.id || Date.now().toString() }
  await appendRow(s, SHEETS.GASTOS_FIJOS, FE_HEADERS, row)
  return row
}

export async function updateGastoFijo(id, data) {
  const s = await getSheets()
  return updateRow(s, SHEETS.GASTOS_FIJOS, id, FE_HEADERS, data)
}

export async function deleteGastoFijo(id) {
  const s = await getSheets()
  return deleteRow(s, SHEETS.GASTOS_FIJOS, id)
}

// ══════════════════════════════════════════════════════════════
// PENDIENTES
// ══════════════════════════════════════════════════════════════
const PEND_HEADERS = ['id','cliente','concepto','total','items','fecha','hora','estado']

export async function getPendientes() {
  const s = await getSheets()
  return readSheet(s, SHEETS.PENDIENTES)
}

export async function addPendiente(data) {
  const s = await getSheets()
  const row = {
    ...data,
    id: data.id || Date.now().toString(),
    items: typeof data.items === 'object' ? JSON.stringify(data.items) : data.items,
    estado: data.estado || 'pendiente',
  }
  await appendRow(s, SHEETS.PENDIENTES, PEND_HEADERS, row)
  return row
}

export async function updatePendiente(id, data) {
  const s = await getSheets()
  const row = { ...data, items: typeof data.items === 'object' ? JSON.stringify(data.items) : data.items }
  return updateRow(s, SHEETS.PENDIENTES, id, PEND_HEADERS, row)
}

export async function deletePendiente(id) {
  const s = await getSheets()
  return deleteRow(s, SHEETS.PENDIENTES, id)
}

// ══════════════════════════════════════════════════════════════
// CRÉDITOS
// ══════════════════════════════════════════════════════════════
const CRED_HEADERS = ['id','cliente','deuda','desc','fecha']
const ABONO_HEADERS = ['id','creditoId','monto','cuenta','fecha','nota']

export async function getCreditos() {
  const s = await getSheets()
  const creditos = await readSheet(s, SHEETS.CREDITOS)
  const abonos = await readSheet(s, SHEETS.ABONOS)
  return creditos.map(c => ({
    ...c,
    deuda: parseFloat(c.deuda) || 0,
    pagos: abonos
      .filter(a => String(a.creditoId) === String(c.id))
      .map(a => ({ ...a, monto: parseFloat(a.monto) || 0 })),
  }))
}

export async function addCredito(data) {
  const s = await getSheets()
  const row = { ...data, id: data.id || Date.now().toString() }
  await appendRow(s, SHEETS.CREDITOS, CRED_HEADERS, row)
  return row
}

export async function addAbono(data) {
  const s = await getSheets()
  const row = { ...data, id: data.id || Date.now().toString() }
  await appendRow(s, SHEETS.ABONOS, ABONO_HEADERS, row)
  return row
}

export async function deleteCredito(id) {
  const s = await getSheets()
  return deleteRow(s, SHEETS.CREDITOS, id)
}

// ══════════════════════════════════════════════════════════════
// PRODUCTOS
// ══════════════════════════════════════════════════════════════
const PROD_HEADERS = ['id','nombre','precio','emoji','activo','orden']

const DEFAULT_PRODUCTOS = [
  { id: '1', nombre: 'Café',          precio: '1500', emoji: '☕', activo: 'true', orden: '1' },
  { id: '2', nombre: 'Cigarrillo',    precio: '1000', emoji: '🚬', activo: 'true', orden: '2' },
  { id: '3', nombre: 'Aromática',     precio: '1000', emoji: '🫖', activo: 'true', orden: '3' },
  { id: '4', nombre: 'Agua Botella',  precio: '2000', emoji: '💧', activo: 'true', orden: '4' },
  { id: '5', nombre: 'Café con Leche',precio: '2000', emoji: '🥛', activo: 'true', orden: '5' },
  { id: '6', nombre: 'Chocolatina',   precio: '1500', emoji: '🍫', activo: 'true', orden: '6' },
  { id: '7', nombre: 'Empanada',      precio: '2500', emoji: '🥟', activo: 'true', orden: '7' },
]

export async function getProductos() {
  const s = await getSheets()
  const rows = await readSheet(s, SHEETS.PRODUCTOS)
  if (rows.length === 0) {
    // Seed defaults
    for (const p of DEFAULT_PRODUCTOS) {
      await appendRow(s, SHEETS.PRODUCTOS, PROD_HEADERS, p)
    }
    return DEFAULT_PRODUCTOS
  }
  return rows
}

export async function addProducto(data) {
  const s = await getSheets()
  const row = { ...data, id: data.id || Date.now().toString(), activo: 'true' }
  await appendRow(s, SHEETS.PRODUCTOS, PROD_HEADERS, row)
  return row
}

export async function updateProducto(id, data) {
  const s = await getSheets()
  return updateRow(s, SHEETS.PRODUCTOS, id, PROD_HEADERS, data)
}

export async function deleteProducto(id) {
  const s = await getSheets()
  return deleteRow(s, SHEETS.PRODUCTOS, id)
}

// ══════════════════════════════════════════════════════════════
// ALL DATA (dashboard load)
// ══════════════════════════════════════════════════════════════
export async function getAllData() {
  const [transacciones, gastos, gastosFijos, pendientes, creditos, productos] = await Promise.all([
    getTx(),
    getGastos(),
    getGastosFijos(),
    getPendientes(),
    getCreditos(),
    getProductos(),
  ])
  return { transacciones, gastos, gastosFijos, pendientes, creditos, productos }
}
