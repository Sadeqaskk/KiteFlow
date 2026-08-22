import { useEffect, useState } from 'react'
import { formatUnits, parseAbiItem } from 'viem'
import { publicClient } from './publicClient'
import { ARC_TOKENS } from './tokens'

const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')

function truncateAddress(addr) {
  if (!addr) return 'Unknown'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// EURC (and any other ERC-20) transfers: real Transfer event logs, fully reliable.
async function getTokenTransfers(token, address, fromBlock) {
  const [sent, received] = await Promise.all([
    publicClient.getLogs({ address: token.address, event: transferEvent, args: { from: address }, fromBlock }),
    publicClient.getLogs({ address: token.address, event: transferEvent, args: { to: address }, fromBlock }),
  ])
  return [...sent, ...received].map((log) => {
    const isSend = log.args.from?.toLowerCase() === address.toLowerCase()
    const counterparty = isSend ? log.args.to : log.args.from
    return {
      id: `${log.transactionHash}-${log.logIndex}`,
      type: isSend ? 'send' : 'receive',
      name: `${isSend ? 'Sent to' : 'Received from'} ${truncateAddress(counterparty)}`,
      counterparty,
      amount: (isSend ? -1 : 1) * parseFloat(formatUnits(log.args.value, token.decimals)),
      symbol: token.symbol,
      status: 'Confirmed',
      blockNumber: log.blockNumber,
    }
  })
}

// Native USDC transfers have no event logs (it's the gas token), so this
// scans a bounded window of recent blocks instead. This gives you recent
// activity, NOT complete history — for full history you'd want ArcScan's
// indexer API once you confirm its endpoint shape.
async function getNativeTransfers(address, latestBlock, blockWindow) {
  const fromBlock = latestBlock - BigInt(blockWindow) > 0n ? latestBlock - BigInt(blockWindow) : 0n
  const blockNumbers = []
  for (let b = fromBlock; b <= latestBlock; b++) blockNumbers.push(b)

  const blocks = await Promise.all(
    blockNumbers.map((n) => publicClient.getBlock({ blockNumber: n, includeTransactions: true }).catch(() => null))
  )

  const results = []
  for (const block of blocks) {
    if (!block) continue
    for (const tx of block.transactions) {
      if (typeof tx === 'string') continue // not expanded, skip
      const from = tx.from?.toLowerCase()
      const to = tx.to?.toLowerCase()
      const addr = address.toLowerCase()
      if (from !== addr && to !== addr) continue
      const isSend = from === addr
      const counterparty = isSend ? tx.to : tx.from
      results.push({
        id: tx.hash,
        type: isSend ? 'send' : 'receive',
        name: `${isSend ? 'Sent to' : 'Received from'} ${truncateAddress(counterparty)}`,
        counterparty,
        amount: (isSend ? -1 : 1) * parseFloat(formatUnits(tx.value, 18)),
        symbol: 'USDC',
        status: 'Confirmed',
        blockNumber: block.number,
      })
    }
  }
  return results
}

export function useArcActivity(address, { nativeBlockWindow = 200, tokenBlockWindow = 5000n } = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setTransactions([])
      return
    }

    let cancelled = false

    const fetchActivity = async () => {
      setLoading(true)
      try {
        const latestBlock = await publicClient.getBlockNumber()
        const tokenLogsPromises = Object.values(ARC_TOKENS)
          .filter((t) => t.symbol !== 'USDC')
          .map((t) =>
            getTokenTransfers(t, address, latestBlock - tokenBlockWindow > 0n ? latestBlock - tokenBlockWindow : 0n).catch(
              () => []
            )
          )

        const [nativeTxs, ...tokenTxsArrays] = await Promise.all([
          getNativeTransfers(address, latestBlock, nativeBlockWindow).catch(() => []),
          ...tokenLogsPromises,
        ])

        const all = [...nativeTxs, ...tokenTxsArrays.flat()].sort((a, b) => Number(b.blockNumber - a.blockNumber))

        if (!cancelled) setTransactions(all)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchActivity()
    const id = setInterval(fetchActivity, 30000) // slower cadence — this does more RPC work than the balance poll
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [address, nativeBlockWindow, tokenBlockWindow])

  return { transactions, loading }
}