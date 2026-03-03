// pages/api/productos.js
import { getProductos, addProducto, updateProducto, deleteProducto } from '../../lib/sheets'
export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.status(200).json(await getProductos())
    if (req.method === 'POST') return res.status(201).json(await addProducto(req.body))
    if (req.method === 'PUT') { const { id, ...d } = req.body; await updateProducto(id, { id, ...d }); return res.status(200).json({ ok: true }) }
    if (req.method === 'DELETE') { await deleteProducto(req.query.id); return res.status(200).json({ ok: true }) }
    res.status(405).end()
  } catch (err) { res.status(500).json({ error: err.message }) }
}
