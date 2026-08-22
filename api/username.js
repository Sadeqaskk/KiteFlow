import { kv } from '@vercel/kv'
import { verifyMessage } from 'viem'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

function claimMessage(username, address) {
  return `Register SmarFPay username "${username}" for ${address}`
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { username, address } = req.query

    if (username) {
      const normalized = String(username).toLowerCase()
      const addr = await kv.get(`username:${normalized}`)
      if (!addr) return res.status(404).json({ error: 'Username not found' })
      return res.status(200).json({ username: normalized, address: addr })
    }
    if (address) {
      const uname = await kv.get(`address:${String(address).toLowerCase()}`)
      return res.status(200).json({ username: uname || null })
    }
    return res.status(400).json({ error: 'username or address query param required' })
  }

  if (req.method === 'POST') {
    const { username, address, signature } = req.body || {}
    if (!username || !address || !signature) {
      return res.status(400).json({ error: 'username, address, and signature are required' })
    }

    const normalized = String(username).toLowerCase()
    if (!USERNAME_RE.test(normalized)) {
      return res.status(400).json({ error: 'Username must be 3-20 lowercase letters, numbers, or underscores.' })
    }

    let signatureValid = false
    try {
      signatureValid = await verifyMessage({
        address,
        message: claimMessage(normalized, address),
        signature,
      })
    } catch {
      signatureValid = false
    }
    if (!signatureValid) {
      return res.status(401).json({ error: 'Signature verification failed.' })
    }

    const existingOwner = await kv.get(`username:${normalized}`)
    if (existingOwner && existingOwner.toLowerCase() !== address.toLowerCase()) {
      return res.status(409).json({ error: 'That username is already taken.' })
    }

    // Release any previous username this address held (one username per address).
    const prevUsername = await kv.get(`address:${address.toLowerCase()}`)
    if (prevUsername && prevUsername !== normalized) {
      await kv.del(`username:${prevUsername}`)
    }

    await kv.set(`username:${normalized}`, address)
    await kv.set(`address:${address.toLowerCase()}`, normalized)

    return res.status(200).json({ username: normalized, address })
  }

  res.status(405).json({ error: 'Method not allowed' })
}