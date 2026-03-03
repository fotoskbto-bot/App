// pages/api/creditos.js
import { getCreditos, addCredito, addAbono, deleteCredito } from '../../lib/sheets'
import { addTx } from '../../lib/sheets'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return res.status(200).json(await getCreditos())

    if (req.method === 'POST') {
      const { tipo, ...data } = req.body
      if (tipo === 'abono') {
        // Register abono + transaction in account
        const abono = await addAbono(data)
        await addTx({
          id: Date.now().toString(),
          fecha: data.fecha,
          concepto: `Abono crédito — ${data.clienteNombre || ''}${data.nota ? ' (' + data.nota + ')' : ''}`,
          monto: data.monto,
          tipo: 'ingreso',
          cuenta: data.cuenta,
          esventa: 'false',
          cliente: data.clienteNombre || '',
          gastoFijoId: '',
        })
        return res.status(201).json(abono)
      }
      const row = await addCredito(data)
      return res.status(201).json(row)
    }

    if (req.method === 'DELETE') {
      await deleteCredito(req.query.id)
      return res.status(200).json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    console.error('[/api/creditos]', err)
    res.status(500).json({ error: err.message })
  }
}
