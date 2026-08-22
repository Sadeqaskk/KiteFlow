import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { address, subscription } = req.body || {}
    if (!address || !subscription) {
      return res.status(400).json({ error: 'address and subscription are required' })
    }
    await kv.set(`push:${address.toLowerCase()}`, subscription)
    return res.status(200).json({ ok: true })
  }

  if (req.method === 'DELETE') {
    const { address } = req.body || {}
    if (!address) return res.status(400).json({ error: 'address is required' })
    await kv.del(`push:${address.toLowerCase()}`)
    return res.status(200).json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}