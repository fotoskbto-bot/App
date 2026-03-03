// pages/api/gastos.js
import { getGastos, addGasto, deleteGasto, updateGasto } from '../../lib/sheets'
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.status(200).json(await getGastos())
    if (req.method === 'POST') return res.status(201).json(await addGasto(req.body))
    if (req.method === 'PUT') { const { id, ...d } = req.body; await updateGasto(id, { id, ...d }); return res.status(200).json({ ok: true }) }
    if (req.method === 'DELETE') { await deleteGasto(req.query.id); return res.status(200).json({ ok: true }) }
    res.status(405).end()
  } catch (err) { res.status(500).json({ error: err.message }) }
}
