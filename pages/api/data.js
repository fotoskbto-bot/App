// pages/api/data.js
import { getAllData, initSheets } from '../../lib/sheets'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    await initSheets()
    const data = await getAllData()
    res.status(200).json(data)
  } catch (err) {
    console.error('[/api/data]', err)
    res.status(500).json({ error: err.message })
  }
}
