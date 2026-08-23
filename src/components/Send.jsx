import React, { useState, useEffect } from 'react'
import { Wallet, ShieldCheck, ArrowRight, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { ARC_TOKENS } from '../lib/tokens'
import { useArcWalletClient } from '../lib/useArcWalletClient'
import { useArcBalance } from '../lib/useArcBalance'
import { useTokenBalance } from '../lib/useTokenBalance'
import { useKiteFlowSend } from '../lib/useKiteFlowSend'
import { isValidAddress } from '../lib/kiteFlowSend'
import { resolveUsername } from '../lib/username'
import { arcTestnet } from '../lib/arcChain'
import TokenSelector from './TokenSelector'

const SEND_ASSETS = [
  { key: 'USDC', symbol: 'USDC', name: 'USD Coin', logo: 'public/usdc.png', native: true, enabled: true },
  { key: 'EURC', symbol: 'EURC', name: 'Euro Coin', logo: 'public/eurc.png', native: false, token: ARC_TOKENS.EURC, enabled: true },
  // cirBTC: no public Circle-issued contract address on Arc Testnet yet.
  // Shown as disabled in the selector — add here once a real address exists.
  { key: 'cirBTC', symbol: 'cirBTC', name: 'Circle Bitcoin', logo: 'public/cirbtc.png', enabled: false },
]

export default function Send({ prefill }) {
  const { wallet } = useArcWalletClient()
  const address = wallet?.address

  const [assetKey, setAssetKey] = useState(
    prefill?.token && SEND_ASSETS.some((a) => a.key === prefill.token && a.enabled) ? prefill.token : 'USDC'
  )
  const [recipientInput, setRecipientInput] = useState('')
  const [resolvedAddress, setResolvedAddress] = useState(null)
  const [resolveState, setResolveState] = useState('idle')
  const [amount, setAmount] = useState(prefill?.amount || '')
  const [memo, setMemo] = useState(prefill?.memo || '')

  const { send, status, error, txHash, reset } = useKiteFlowSend()
  const { balance: nativeBalance } = useArcBalance(address)
  const eurcBalance = useTokenBalance(ARC_TOKENS.EURC.address, address, ARC_TOKENS.EURC.decimals)

  const asset = SEND_ASSETS.find((a) => a.key === assetKey)
  const liveBalance = asset.native ? nativeBalance : eurcBalance
  const balanceNum = liveBalance != null ? parseFloat(liveBalance) : 0

  const isUsernameInput = recipientInput.startsWith('@') || (!recipientInput.startsWith('0x') && recipientInput.length > 0)

  const handleRecipientChange = async (raw) => {
    setRecipientInput(raw)
    setResolvedAddress(null)

    const trimmed = raw.trim()
    if (!trimmed) {
      setResolveState('idle')
      return
    }
    if (isValidAddress(trimmed)) {
      setResolvedAddress(trimmed)
      setResolveState('found')
      return
    }

    const username = trimmed.replace(/^@/, '').toLowerCase()
    if (username.length < 3) {
      setResolveState('idle')
      return
    }
    setResolveState('checking')
    try {
      const addr = await resolveUsername(username)
      setResolvedAddress(addr)
      setResolveState('found')
    } catch {
      setResolveState('not_found')
    }
  }

  useEffect(() => {
    if (prefill?.to) handleRecipientChange(prefill.to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.to])

  const canSend = Boolean(address) && resolveState === 'found' && amount && Number(amount) > 0 && status !== 'sending' && status !== 'approving'

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-md animate-fade-up py-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-400/10">
          <ShieldCheck size={34} className="text-teal-300" strokeWidth={1.8} />
        </div>
        <h2 className="mt-6 font-display text-2xl text-pearl">Transfer sent</h2>
        <p className="mt-2 text-sm text-pearl-faint">
          {amount} {asset.symbol} is on its way to {recipientInput.startsWith('0x') ? `${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)}` : recipientInput} on Arc Testnet.
        </p>
        <div className="glass mt-6 rounded-2xl p-4 text-left text-xs text-pearl-faint">
          <div className="flex justify-between py-1.5"><span>Network</span><span className="text-pearl">Arc Testnet</span></div>
          <div className="flex justify-between py-1.5"><span>Status</span><span className="text-teal-300">Confirmed</span></div>
          <a
            href={`${arcTestnet.blockExplorers.default.url}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between py-1.5 text-pearl hover:text-teal-300"
          >
            <span className="text-pearl-faint">Transaction</span>
            <span className="flex items-center gap-1 font-mono">{txHash.slice(0, 8)}...{txHash.slice(-6)} <ExternalLink size={12} /></span>
          </a>
        </div>
        <button
          onClick={() => { reset(); setAmount(''); setRecipientInput(''); setResolvedAddress(null); setResolveState('idle'); setMemo('') }}
          className="btn-ghost mt-6 w-full"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-3xl animate-fade-up gap-6 lg:grid-cols-5">
      <div className="glass rounded-4xl p-7 lg:col-span-3">
        <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Recipient</p>

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <input
            value={recipientInput}
            onChange={(e) => handleRecipientChange(e.target.value)}
            placeholder="@username or 0x address"
            spellCheck={false}
            className="w-full bg-transparent font-mono text-sm text-pearl placeholder:text-pearl-faint outline-none"
          />
          {resolveState === 'checking' && <Loader2 size={14} className="animate-spin text-pearl-faint" />}
        </div>

        {resolveState === 'found' && isUsernameInput && (
          <p className="mt-2 text-xs text-teal-300">→ {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}</p>
        )}
        {resolveState === 'not_found' && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
            <AlertCircle size={12} /> No wallet found for that username.
          </p>
        )}
        {recipientInput.length > 0 && !isUsernameInput && resolveState !== 'found' && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
            <AlertCircle size={12} /> Not a valid address (0x + 40 hex characters).
          </p>
        )}

        <p className="mt-6 text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Memo (optional, on-chain)</p>
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value.slice(0, 140))}
            placeholder="What's this for?"
            className="w-full bg-transparent text-sm text-pearl placeholder:text-pearl-faint outline-none"
          />
        </div>

        {!address && (
          <p className="mt-6 flex items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] px-4 py-3 text-xs text-pearl-faint">
            <Wallet size={14} className="text-violet-300" /> Connect your wallet to send a live payment.
          </p>
        )}
      </div>

      <div className="glass sheen relative overflow-hidden rounded-4xl p-7 lg:col-span-2">
        <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Amount</p>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-midnight-950/50 px-4 py-3.5">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            className="w-full bg-transparent font-display text-2xl text-pearl placeholder:text-pearl-faint outline-none"
          />
          <TokenSelector tokens={SEND_ASSETS} value={asset} onChange={(t) => setAssetKey(t.key)} />
        </div>
        <p className="mt-2 text-xs text-pearl-faint">
          Available: {address ? balanceNum.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'} {asset.symbol}
        </p>

        <div className="mt-4 flex gap-2">
          {[25, 50, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => setAmount(((balanceNum * pct) / 100).toFixed(4))}
              disabled={!address}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] py-2 text-xs text-pearl-dim hover:bg-white/[0.06] disabled:opacity-30"
            >
              {pct}%
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-pearl-faint">
          <div className="flex justify-between py-1"><span>Contract</span><span className="text-pearl">KiteFlowSend</span></div>
          <div className="flex justify-between py-1"><span>Network fee</span><span className="text-pearl">Paid in USDC · shown in wallet</span></div>
          <div className="flex justify-between py-1"><span>Arrives</span><span className="text-teal-300">Instantly</span></div>
        </div>

        {error && (
          <p className="mt-4 flex items-start gap-1.5 text-xs text-red-300">
            <AlertCircle size={12} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        <button
          onClick={() => send({ token: asset.native ? null : asset.token, to: resolvedAddress, amount, memo })}
          disabled={!canSend}
          className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'approving' && 'Approving...'}
          {status === 'sending' && 'Sending...'}
          {(status === 'idle' || status === 'error') && (
            <>Review &amp; send <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  )
}