// pages/api/pendientes.js
import { getPendientes, addPendiente, updatePendiente, deletePendiente } from '../../lib/sheets'
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.status(200).json(await getPendientes())
    if (req.method === 'POST') return res.status(201).json(await addPendiente(req.body))
    if (req.method === 'PUT') { const { id, ...d } = req.body; await updatePendiente(id, { id, ...d }); return res.status(200).json({ ok: true }) }
    if (req.method === 'DELETE') { await deletePendiente(req.query.id); return res.status(200).json({ ok: true }) }
    res.status(405).end()
  } catch (err) { res.status(500).json({ error: err.message }) }
}
