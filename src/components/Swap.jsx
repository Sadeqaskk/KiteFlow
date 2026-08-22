import React, { useState, useEffect, useCallback } from 'react'
import { parseUnits, formatUnits } from 'viem'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { ArrowDownUp, Info, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import { SWAPPABLE_TOKENS } from '../lib/tokens'
import { ARROW_ROUTER_ADDRESS, isValidAddress } from '../lib/arrowRouter'
import { arrowRouterAbi } from '../lib/arrowRouterAbi'
import { erc20Abi } from '../lib/erc20Abi'
import { publicClient } from '../lib/publicClient'
import { arcTestnet } from '../lib/arcChain'
import { useArcWalletClient } from '../lib/useArcWalletClient'
import { useTokenBalance } from '../lib/useTokenBalance'

const SLIPPAGE_BPS = 50n // 0.50% default slippage tolerance

export default function Swap() {
  const { authenticated, login } = usePrivy()
  const { wallets } = useWallets()
  const { getWalletClient } = useArcWalletClient()
  const address = wallets[0]?.address

  const [from, setFrom] = useState(SWAPPABLE_TOKENS[0])
  const [to, setTo] = useState(SWAPPABLE_TOKENS[1])
  const [amount, setAmount] = useState('')

  const [quote, setQuote] = useState(null)
  const [priceImpactBps, setPriceImpactBps] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')

  const [needsApproval, setNeedsApproval] = useState(false)
  const [status, setStatus] = useState('idle')
  const [txHash, setTxHash] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const fromBalance = useTokenBalance(from.address, address, from.decimals)
  const toBalance = useTokenBalance(to.address, address, to.decimals)

  const routerReady = isValidAddress(ARROW_ROUTER_ADDRESS)

  const amountInWei = (() => {
    if (!amount) return null
    try {
      return parseUnits(amount, from.decimals)
    } catch {
      return null
    }
  })()

  useEffect(() => {
    if (!routerReady || !amountInWei || amountInWei === 0n || from.symbol === to.symbol) {
      setQuote(null)
      setPriceImpactBps(null)
      setQuoteError('')
      return
    }

    let cancelled = false
    setQuoteLoading(true)
    setQuoteError('')

    const timer = setTimeout(async () => {
      try {
        const [path, pools, amountOut] = await publicClient.readContract({
          address: ARROW_ROUTER_ADDRESS,
          abi: arrowRouterAbi,
          functionName: 'getBestPath',
          args: [from.address, to.address, amountInWei],
        })

        const impact = await publicClient.readContract({
          address: ARROW_ROUTER_ADDRESS,
          abi: arrowRouterAbi,
          functionName: 'getPriceImpactBps',
          args: [from.address, to.address, amountInWei],
        })

        if (!cancelled) {
          setQuote({ path, pools, amountOut })
          setPriceImpactBps(impact)
        }
      } catch (err) {
        if (!cancelled) {
          setQuote(null)
          setPriceImpactBps(null)
          setQuoteError('No route found for this pair/amount on ArrowRouter.')
        }
      } finally {
        if (!cancelled) setQuoteLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [amountInWei, from, to, routerReady])

  useEffect(() => {
    if (!routerReady || !address || !amountInWei || amountInWei === 0n) {
      setNeedsApproval(false)
      return
    }
    let cancelled = false
    publicClient
      .readContract({
        address: from.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, ARROW_ROUTER_ADDRESS],
      })
      .then((allowance) => {
        if (!cancelled) setNeedsApproval(allowance < amountInWei)
      })
      .catch(() => {
        if (!cancelled) setNeedsApproval(true)
      })
    return () => {
      cancelled = true
    }
  }, [address, from, amountInWei, routerReady])

  const flip = () => {
    setFrom(to)
    setTo(from)
    setQuote(null)
  }

  const minAmountOut = quote ? (quote.amountOut * (10000n - SLIPPAGE_BPS)) / 10000n : null

  const handleApprove = useCallback(async () => {
    if (!amountInWei) return
    setStatus('approving')
    setErrorMsg('')
    try {
      const walletClient = await getWalletClient()
      const hash = await walletClient.writeContract({
        address: from.address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [ARROW_ROUTER_ADDRESS, amountInWei],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setNeedsApproval(false)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err?.shortMessage || err?.message || 'Approval failed')
    }
  }, [amountInWei, from, getWalletClient])

  const handleSwap = useCallback(async () => {
    if (!amountInWei || !minAmountOut || !address) return
    setStatus('swapping')
    setErrorMsg('')
    try {
      const walletClient = await getWalletClient()
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
      const hash = await walletClient.writeContract({
        address: ARROW_ROUTER_ADDRESS,
        abi: arrowRouterAbi,
        functionName: 'swapExactTokensForTokens',
        args: [from.address, to.address, amountInWei, minAmountOut, address, deadline],
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err?.shortMessage || err?.message || 'Swap failed')
    }
  }, [amountInWei, minAmountOut, address, from, to, getWalletClient])

  const outputDisplay = quote ? formatUnits(quote.amountOut, to.decimals) : ''
  const impactPct = priceImpactBps != null ? (Number(priceImpactBps) / 100).toFixed(2) : null
  const highImpact = priceImpactBps != null && priceImpactBps > 300n

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-md animate-fade-up py-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-400/10">
          <ArrowDownUp size={30} className="text-teal-300" strokeWidth={1.8} />
        </div>
        <h2 className="mt-6 font-display text-2xl text-pearl">Swap submitted</h2>
        <p className="mt-2 text-sm text-pearl-faint">
          {amount} {from.symbol} → {outputDisplay} {to.symbol} on Arc Testnet via ArrowRouter.
        </p>
        <a
          href={`${arcTestnet.blockExplorers.default.url}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="glass mt-6 flex items-center justify-center gap-2 rounded-2xl p-4 text-xs text-pearl-dim hover:text-pearl"
        >
          View transaction on ArcScan <ExternalLink size={14} />
        </a>
        <button
          onClick={() => {
            setStatus('idle')
            setAmount('')
            setQuote(null)
            setTxHash('')
          }}
          className="btn-ghost mt-6 w-full"
        >
          Swap again
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-up">
      {!routerReady && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber/25 bg-amber/10 px-4 py-3 text-xs text-amber">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            No valid ArrowRouter address configured. Set <code>VITE_ARROW_ROUTER_ADDRESS</code> in
            your <code>.env</code> to a real 40-character contract address to enable swapping.
          </span>
        </div>
      )}

      <div className="glass sheen relative overflow-hidden rounded-4xl p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl animate-float"
          style={{ background: 'conic-gradient(from 90deg, #7C6CFF, #4FD1C5, #7C6CFF)' }}
        />

        <div className="relative">
          <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">You pay</p>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-midnight-950/50 px-4 py-4">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              className="w-full bg-transparent font-display text-3xl text-pearl placeholder:text-pearl-faint outline-none"
            />
            <div className="flex gap-1.5">
              {SWAPPABLE_TOKENS.map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => setFrom(t)}
                  disabled={t.symbol === to.symbol}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    from.symbol === t.symbol ? 'bg-aurora text-midnight-950' : 'bg-white/[0.05] text-pearl-dim hover:bg-white/[0.1]'
                  }`}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-pearl-faint">
            {authenticated ? (
              <>Balance: {fromBalance != null ? Number(fromBalance).toLocaleString() : '—'} {from.symbol}</>
            ) : (
              'Connect a wallet to see your real balance'
            )}
          </p>

          <div className="relative my-1 flex justify-center">
            <button
              onClick={flip}
              className="z-10 -my-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-iris-panel text-pearl-dim shadow-panel hover:text-pearl"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>

          <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">You receive</p>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-midnight-950/50 px-4 py-4">
            <div className="flex w-full items-center gap-2">
              {quoteLoading ? (
                <Loader2 size={20} className="animate-spin text-pearl-faint" />
              ) : (
                <input
                  value={outputDisplay}
                  readOnly
                  placeholder="0.00"
                  className="w-full bg-transparent font-display text-3xl text-pearl placeholder:text-pearl-faint outline-none"
                />
              )}
            </div>
            <div className="flex gap-1.5">
              {SWAPPABLE_TOKENS.filter((t) => t.symbol !== from.symbol).map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => setTo(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    to.symbol === t.symbol ? 'bg-aurora text-midnight-950' : 'bg-white/[0.05] text-pearl-dim hover:bg-white/[0.1]'
                  }`}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-pearl-faint">
            {authenticated ? (
              <>Balance: {toBalance != null ? Number(toBalance).toLocaleString() : '—'} {to.symbol}</>
            ) : (
              '\u00A0'
            )}
          </p>

          <div className="mt-6 flex items-start gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-pearl-faint">
            <Info size={14} className="mt-0.5 shrink-0 text-violet-300" />
            <span>
              Direct swap on Arc Testnet via ArrowRouter — same-chain liquidity, no bridging.
              {quote && (
                <>
                  {' '}Route: {quote.path.length - 1} hop{quote.path.length - 1 === 1 ? '' : 's'}.
                  {impactPct != null && (
                    <span className={highImpact ? 'text-blush' : ''}> Price impact: {impactPct}%.</span>
                  )}
                </>
              )}
              {quoteError && <span className="text-blush"> {quoteError}</span>}
            </span>
          </div>

          {errorMsg && (
            <div className="mt-3 rounded-2xl border border-blush/25 bg-blush/10 px-4 py-3 text-xs text-blush">
              {errorMsg}
            </div>
          )}

          {!authenticated ? (
            <button onClick={login} className="btn-primary mt-6 w-full">
              Connect wallet to swap
            </button>
          ) : needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={!quote || status === 'approving' || !routerReady}
              className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === 'approving' ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Approving {from.symbol}...
                </>
              ) : (
                `Approve ${from.symbol}`
              )}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={!quote || status === 'swapping' || !routerReady}
              className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === 'swapping' ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Swapping...
                </>
              ) : (
                `Swap ${from.symbol} → ${to.symbol}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}