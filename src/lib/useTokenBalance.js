import { useEffect, useState } from 'react'
import { formatUnits } from 'viem'
import { publicClient } from './publicClient'
import { erc20Abi } from './erc20Abi'

export function useTokenBalance(tokenAddress, owner, decimals = 6) {
  const [balance, setBalance] = useState(null)

  useEffect(() => {
    if (!tokenAddress || !owner) {
      setBalance(null)
      return
    }

    let cancelled = false

    const fetchBalance = async () => {
      try {
        const raw = await publicClient.readContract({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [owner],
        })
        if (!cancelled) setBalance(formatUnits(raw, decimals))
      } catch {
        if (!cancelled) setBalance(null)
      }
    }

    fetchBalance()
    const id = setInterval(fetchBalance, 15000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [tokenAddress, owner, decimals])

  return balance
}