// pages/api/gastos-fijos.js
import { getGastosFijos, addGastoFijo, updateGastoFijo, deleteGastoFijo } from '../../lib/sheets'
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.status(200).json(await getGastosFijos())
    if (req.method === 'POST') return res.status(201).json(await addGastoFijo(req.body))
    if (req.method === 'PUT') { const { id, ...d } = req.body; await updateGastoFijo(id, { id, ...d }); return res.status(200).json({ ok: true }) }
    if (req.method === 'DELETE') { await deleteGastoFijo(req.query.id); return res.status(200).json({ ok: true }) }
    res.status(405).end()
  } catch (err) { res.status(500).json({ error: err.message }) }
}
