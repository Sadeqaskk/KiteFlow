import { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { publicClient } from './publicClient'
import { erc20Abi } from './erc20Abi'
import { ARC_TOKENS } from './tokens'

export function useArcBalances(address) {
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setBalances([])
      return
    }

    let cancelled = false

    const fetchAll = async () => {
      setLoading(true)
      try {
        const results = await Promise.all(
          Object.values(ARC_TOKENS).map(async (token) => {
            try {
              // All Arc tokens (including USDC) are ERC-20 contracts at a
              // real address — read balanceOf for every one of them, no
              // special-casing. Using publicClient.getBalance() here would
              // read the native gas balance instead, which is wrong.
              const raw = await publicClient.readContract({
                address: token.address,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address],
              })
              return { symbol: token.symbol, icon: token.icon, amount: parseFloat(formatUnits(raw, token.decimals)) }
            } catch {
              return { symbol: token.symbol, icon: token.icon, amount: 0 }
            }
          })
        )
        if (!cancelled) setBalances(results)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAll()
    const id = setInterval(fetchAll, 15000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [address])

  return { balances, loading }
}