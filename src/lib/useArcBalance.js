import { useEffect, useState } from 'react'
import { getLiveUsdcBalance } from './publicClient'

export function useArcBalance(address) {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setBalance(null)
      return
    }

    let cancelled = false

    const fetchBalance = () => {
      setLoading(true)
      getLiveUsdcBalance(address)
        .then((value) => {
          if (!cancelled) setBalance(value)
        })
        .catch(() => {
          if (!cancelled) setBalance(null)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    fetchBalance()
    const id = setInterval(fetchBalance, 15000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [address])

  return { balance, loading }
}