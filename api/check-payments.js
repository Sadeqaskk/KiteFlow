import { Redis } from '@upstash/redis'
import { createPublicClient, http, formatUnits } from 'viem'
import { arcTestnet } from '../src/lib/arcChain'
import { kiteFlowSendAbi } from '../src/lib/kiteFlowSendAbi'
import webpush from 'web-push'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

const KITEFLOW_SEND_ADDRESS = process.env.VITE_KITEFLOW_SEND_ADDRESS
const NATIVE = '0x0000000000000000000000000000000000000000'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() })

export default async function handler(req, res) {
  const authHeader = req.headers['authorization']
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isExternalCaller = req.query.secret && req.query.secret === process.env.PUSH_CRON_SECRET
  if (!isVercelCron && !isExternalCaller) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!KITEFLOW_SEND_ADDRESS) {
    return res.status(500).json({ error: 'KiteFlowSend address not configured' })
  }

  try {
    const lastBlock = (await redis.get('lastProcessedBlock')) || 0
    const latest = await publicClient.getBlockNumber()

    if (BigInt(lastBlock) >= latest) {
      return res.status(200).json({ ok: true, checked: 0 })
    }

    const logs = await publicClient.getContractEvents({
      address: KITEFLOW_SEND_ADDRESS,
      abi: kiteFlowSendAbi,
      eventName: 'PaymentSent',
      fromBlock: BigInt(lastBlock) + 1n,
      toBlock: latest,
    })

    let sent = 0
    for (const log of logs) {
      const { to, amount, token } = log.args
      const subscription = await redis.get(`push:${to.toLowerCase()}`)
      if (!subscription) continue

      const decimals = token.toLowerCase() === NATIVE ? 18 : 6
      const value = formatUnits(amount, decimals)

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title: 'Payment received', body: `You received ${value} on KiteFlow`, url: '/' })
        )
        sent++
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await redis.del(`push:${to.toLowerCase()}`)
        }
      }
    }

    await redis.set('lastProcessedBlock', latest.toString())
    return res.status(200).json({ ok: true, checked: logs.length, sent })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}