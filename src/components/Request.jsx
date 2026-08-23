import React, { useState, useMemo, useEffect } from 'react'
import { Link2, Send as SendIcon, Clock3, Copy, Check } from 'lucide-react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useArcBalances } from '../lib/useArcBalances'
import { useArcActivity } from '../lib/useArcActivity'
import { SWAPPABLE_TOKENS } from '../lib/tokens'
import { getUsernameForAddress } from '../lib/username'
import { useConnectModal } from '../lib/connectModalContext'
import TokenSelector from './TokenSelector'

const REQUESTABLE_TOKENS = SWAPPABLE_TOKENS.map((t) => ({ ...t, enabled: true }))
const STORAGE_KEY = 'kiteflow:pendingRequests'

function loadPendingRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePendingRequests(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

function truncateAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function Request() {
  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const { open: openConnectModal } = useConnectModal()
  const myAddress = user?.wallet?.address || wallets[0]?.address

  const { balances: liveBalances, loading: balancesLoading } = useArcBalances(myAddress)
  const { transactions } = useArcActivity(myAddress)

  const [myUsername, setMyUsername] = useState(null)
  const [asset, setAsset] = useState(REQUESTABLE_TOKENS[0])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [selected, setSelected] = useState(null)
  const [manualAddress, setManualAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [pending, setPending] = useState(loadPendingRequests)

  useEffect(() => {
    if (!myAddress) {
      setMyUsername(null)
      return
    }
    let cancelled = false
    getUsernameForAddress(myAddress).then((u) => { if (!cancelled) setMyUsername(u) })
    return () => { cancelled = true }
  }, [myAddress])

  const contacts = useMemo(() => {
    const seen = new Map()
    for (const tx of transactions) {
      if (tx.type !== 'receive' || !tx.counterparty) continue
      const key = tx.counterparty.toLowerCase()
      if (!seen.has(key)) {
        seen.set(key, {
          name: truncateAddress(tx.counterparty),
          address: tx.counterparty,
          avatarColor: 'from-violet-500/40 to-teal-400/40',
        })
      }
    }
    return Array.from(seen.values())
  }, [transactions])

  useEffect(() => {
    if (!pending.length || !transactions.length) return
    const stillOpen = pending.filter((req) => {
      const fulfilled = transactions.some(
        (tx) =>
          tx.type === 'receive' &&
          tx.counterparty?.toLowerCase() === req.from?.toLowerCase() &&
          tx.symbol === req.symbol &&
          Math.abs(tx.amount - req.amount) < 1e-9
      )
      return !fulfilled
    })
    if (stillOpen.length !== pending.length) {
      setPending(stillOpen)
      savePendingRequests(stillOpen)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions])

  const recipientAddress = selected?.address || (manualAddress.trim() || null)
  const canRequest = authenticated && myAddress && recipientAddress && amount && Number(amount) > 0

  const buildLink = () => {
    const params = new URLSearchParams({
      to: myUsername ? `@${myUsername}` : myAddress,
      amount,
      token: asset.symbol,
    })
    if (note) params.set('memo', note)
    return `${window.location.origin}/pay?${params.toString()}`
  }

  const recordRequest = () => {
    const entry = {
      id: `${Date.now()}`,
      name: selected?.name || truncateAddress(recipientAddress),
      from: recipientAddress,
      amount: Number(amount),
      symbol: asset.symbol,
      time: 'Just now',
      createdAt: Date.now(),
    }
    const next = [entry, ...pending]
    setPending(next)
    savePendingRequests(next)
  }

  const handleSendRequest = async () => {
    if (!canRequest) return
    const link = buildLink()
    const shareText = `Requesting ${amount} ${asset.symbol} on KiteFlow${note ? ` — ${note}` : ''}: ${link}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'KiteFlow payment request', text: shareText, url: link })
      } catch {
        return
      }
    } else {
      await navigator.clipboard?.writeText(shareText)
    }
    recordRequest()
    setAmount('')
    setNote('')
  }

  const handleCopyLink = async () => {
    if (!canRequest) return
    await navigator.clipboard?.writeText(buildLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="mx-auto grid max-w-3xl animate-fade-up gap-6 lg:grid-cols-5">
      <div className="glass rounded-4xl p-7 lg:col-span-3">
        <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Request from</p>

        {!ready ? (
          <div className="mt-3 h-24 animate-pulse rounded-2xl bg-white/5" />
        ) : !authenticated ? (
          <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
            <p className="text-xs text-pearl-faint">Connect your wallet to request funds</p>
            <button onClick={openConnectModal} className="btn-primary !px-4 !py-2 text-xs">Connect wallet</button>
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-col gap-2">
              {contacts.length === 0 && (
                <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-xs text-pearl-faint">
                  No past senders yet on this wallet — enter an address below.
                </p>
              )}
              {contacts.map((c) => (
                <button
                  key={c.address}
                  onClick={() => { setSelected(c); setManualAddress('') }}
                  className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                    selected?.address === c.address ? 'border-violet-400/40 bg-violet-500/[0.08]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${c.avatarColor}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-pearl">{c.name}</p>
                    <p className="font-mono text-[11px] text-pearl-faint">{c.address}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Or enter an address</p>
            <input
              value={manualAddress}
              onChange={(e) => { setManualAddress(e.target.value); setSelected(null) }}
              placeholder="0x..."
              className="input-luxe mt-3 font-mono text-xs"
            />
          </>
        )}

        <p className="mt-6 text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Note</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's this for?"
          rows={3}
          className="input-luxe mt-3 resize-none"
        />
      </div>

      <div className="glass rounded-4xl p-7 lg:col-span-2">
        <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Amount requested</p>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-midnight-950/50 px-4 py-3.5">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            className="w-full bg-transparent font-display text-2xl text-pearl placeholder:text-pearl-faint outline-none"
          />
          <TokenSelector tokens={REQUESTABLE_TOKENS} value={asset} onChange={setAsset} />
        </div>
        {!balancesLoading && (
          <p className="mt-1.5 text-[11px] text-pearl-faint">
            Your balance: {(liveBalances.find((b) => b.symbol === asset.symbol)?.amount ?? 0).toFixed(4)} {asset.symbol}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <button onClick={handleSendRequest} disabled={!canRequest} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40">
            <SendIcon size={16} /> Send request
          </button>
          <button onClick={handleCopyLink} disabled={!canRequest} className="btn-ghost w-full disabled:cursor-not-allowed disabled:opacity-40">
            {copied ? <Check size={16} className="text-teal-300" /> : <Link2 size={16} />} Create payment link
          </button>
        </div>

        <div className="mt-7">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">
            <Clock3 size={12} /> Pending requests
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {pending.length === 0 && (
              <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-xs text-pearl-faint">
                No open requests.
              </p>
            )}
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
                <div>
                  <p className="text-sm text-pearl">{p.name}</p>
                  <p className="text-[11px] text-pearl-faint">{p.time}</p>
                </div>
                <span className="chip !bg-amber/10 !text-amber !border-amber/25">
                  {p.amount.toFixed(2)} {p.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}