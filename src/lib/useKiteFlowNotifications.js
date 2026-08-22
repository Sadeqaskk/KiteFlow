import { useCallback, useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { publicClient } from './publicClient'
import { kiteFlowSendAbi } from './kiteFlowSendAbi'
import { KITEFLOW_SEND_ADDRESS } from './kiteFlowSend'
import { KITEFLOW_DEPLOY_BLOCK, tokenMeta } from './useKiteFlowHistory'
import { getUsernameForAddress } from './username'

const REQUESTS_KEY = 'kiteflow:pendingRequests'
const NOTIFS_KEY_PREFIX = 'kiteflow:notifications:'
const LAST_BLOCK_KEY_PREFIX = 'kiteflow:lastSeenBlock:'

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function useKiteFlowNotifications(address, pollMs = 20000) {
  const [notifications, setNotifications] = useState(() =>
    address ? loadJSON(NOTIFS_KEY_PREFIX + address.toLowerCase(), []) : []
  )

  const refresh = useCallback(async () => {
    if (!address || !KITEFLOW_SEND_ADDRESS) return

    const key = address.toLowerCase()
    const notifsKey = NOTIFS_KEY_PREFIX + key
    const lastBlockKey = LAST_BLOCK_KEY_PREFIX + key

    const stored = loadJSON(notifsKey, [])
    const lastSeenBlock = BigInt(loadJSON(lastBlockKey, KITEFLOW_DEPLOY_BLOCK.toString()))

    try {
      const latest = await publicClient.getBlockNumber()
      if (lastSeenBlock >= latest) return

      const logs = await publicClient.getContractEvents({
        address: KITEFLOW_SEND_ADDRESS,
        abi: kiteFlowSendAbi,
        eventName: 'PaymentSent',
        args: { to: address },
        fromBlock: lastSeenBlock + 1n,
        toBlock: latest,
      })

      const paymentNotifs = await Promise.all(
        logs.map(async (log) => {
          const fromUsername = await getUsernameForAddress(log.args.from)
          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            type: 'payment_received',
            message: `Payment received${fromUsername ? ` from @${fromUsername}` : ''}`,
            txHash: log.transactionHash,
            timestamp: Number(log.args.timestamp) * 1000,
            read: false,
          }
        })
      )

      const pending = loadJSON(REQUESTS_KEY, [])
      const fulfilledNotifs = []
      for (const req of pending) {
        const match = logs.find((log) => {
          if (log.args.from?.toLowerCase() !== req.from?.toLowerCase()) return false
          const { symbol, decimals } = tokenMeta(log.args.token)
          if (symbol !== req.symbol) return false
          const value = parseFloat(formatUnits(log.args.amount, decimals))
          return Math.abs(value - req.amount) < 1e-6
        })
        if (match) {
          fulfilledNotifs.push({
            id: `req-${req.id}`,
            type: 'request_fulfilled',
            message: `${req.name} paid your request for ${req.amount} ${req.symbol}`,
            txHash: match.transactionHash,
            timestamp: Date.now(),
            read: false,
          })
        }
      }

      const merged = [...fulfilledNotifs, ...paymentNotifs, ...stored].slice(0, 50)
      setNotifications(merged)
      saveJSON(notifsKey, merged)
      saveJSON(lastBlockKey, latest.toString())
    } catch {
      // silent — next poll retries
    }
  }, [address])

  useEffect(() => {
    if (!address) {
      setNotifications([])
      return
    }
    refresh()
    const id = setInterval(refresh, pollMs)
    return () => clearInterval(id)
  }, [address, refresh, pollMs])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = useCallback(() => {
    if (!address) return
    const key = NOTIFS_KEY_PREFIX + address.toLowerCase()
    const updated = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(updated)
    saveJSON(key, updated)
  }, [address, notifications])

  return { notifications, unreadCount, markAllRead, refresh }
}