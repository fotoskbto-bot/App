// pages/api/transacciones.js
import { getTx, addTx, deleteTx, updateTx } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await getTx()
      return res.status(200).json(data)
    }
    if (req.method === 'POST') {
      const row = await addTx(req.body)
      return res.status(201).json(row)
    }
    if (req.method === 'PUT') {
      const { id, ...data } = req.body
      await updateTx(id, { id, ...data })
      return res.status(200).json({ ok: true })
    }
    if (req.method === 'DELETE') {
      const { id } = req.query
      await deleteTx(id)
      return res.status(200).json({ ok: true })
    }
    res.status(405).end()
  } catch (err) {
    console.error('[/api/transacciones]', err)
    res.status(500).json({ error: err.message })
  }
}
