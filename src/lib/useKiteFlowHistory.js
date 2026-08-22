import { useEffect, useState, useCallback } from 'react'
import { formatUnits } from 'viem'
import { publicClient } from './publicClient'
import { kiteFlowSendAbi } from './kiteFlowSendAbi'
import { KITEFLOW_SEND_ADDRESS } from './kiteFlowSend'
import { getUsernameForAddress } from './username'
import { ARC_TOKENS } from './tokens'

// Fill this in with the real deployment block for KiteFlowSend, found on
// Blockscout: contract page -> "at txn" link -> block number on that tx.
// Left at 0n by default — works, just scans more blocks than necessary.
export const KITEFLOW_DEPLOY_BLOCK = 0n

const NATIVE = '0x0000000000000000000000000000000000000000'

const AVATAR_COLORS = [
  'from-violet-400 to-fuchsia-500',
  'from-sky-400 to-blue-500',
  'from-amber-400 to-orange-500',
  'from-teal-400 to-emerald-500',
  'from-rose-400 to-pink-500',
]

function colorForAddress(address) {
  let hash = 0
  for (let i = 0; i < address.length; i++) hash = (hash * 31 + address.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function tokenMeta(tokenAddress) {
  if (!tokenAddress || tokenAddress.toLowerCase() === NATIVE) return { symbol: 'USDC', decimals: 18 }
  const match = Object.values(ARC_TOKENS).find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
  return { symbol: match?.symbol ?? 'Token', decimals: match?.decimals ?? 18 }
}

export function useKiteFlowHistory(address, limit = 5) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!address || !KITEFLOW_SEND_ADDRESS) {
      setContacts([])
      return
    }
    setLoading(true)
    try {
      const [sentLogs, receivedLogs] = await Promise.all([
        publicClient.getContractEvents({
          address: KITEFLOW_SEND_ADDRESS,
          abi: kiteFlowSendAbi,
          eventName: 'PaymentSent',
          args: { from: address },
          fromBlock: KITEFLOW_DEPLOY_BLOCK,
          toBlock: 'latest',
        }),
        publicClient.getContractEvents({
          address: KITEFLOW_SEND_ADDRESS,
          abi: kiteFlowSendAbi,
          eventName: 'PaymentSent',
          args: { to: address },
          fromBlock: KITEFLOW_DEPLOY_BLOCK,
          toBlock: 'latest',
        }),
      ])

      const byCounterparty = new Map()

      const record = (log, direction) => {
        const { from, to, token, amount, memo, timestamp } = log.args
        const counterparty = direction === 'sent' ? to : from
        const key = counterparty.toLowerCase()
        if (!byCounterparty.has(key)) {
          byCounterparty.set(key, {
            address: counterparty,
            color: colorForAddress(counterparty),
            count: 0,
            sentTotals: {},
            receivedTotals: {},
            history: [],
          })
        }
        const entry = byCounterparty.get(key)
        entry.count += 1
        const { symbol, decimals } = tokenMeta(token)
        const value = parseFloat(formatUnits(amount, decimals))
        const bucket = direction === 'sent' ? entry.sentTotals : entry.receivedTotals
        bucket[symbol] = (bucket[symbol] || 0) + value
        entry.history.push({
          direction,
          symbol,
          amount: value,
          memo,
          timestamp: Number(timestamp) * 1000,
          txHash: log.transactionHash,
        })
      }

      sentLogs.forEach((log) => record(log, 'sent'))
      receivedLogs.forEach((log) => record(log, 'received'))

      const merged = Array.from(byCounterparty.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      const withUsernames = await Promise.all(
        merged.map(async (c) => ({
          ...c,
          username: await getUsernameForAddress(c.address),
          history: c.history.sort((a, b) => b.timestamp - a.timestamp),
        }))
      )

      setContacts(withUsernames)
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }, [address, limit])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { contacts, loading, refresh }
}