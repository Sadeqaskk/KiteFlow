import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Copy, Check, Share2, Wallet, AtSign, ArrowRight } from 'lucide-react'
import { useArcBalances } from '../lib/useArcBalances'
import { ALL_DISPLAY_TOKENS } from '../lib/tokens'
import { getUsernameForAddress } from '../lib/username'
import { useConnectModal } from '../lib/connectModalContext'

export default function Receive({ onNavigate }) {
  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const { open: openConnectModal } = useConnectModal()
  const [copied, setCopied] = useState(false)
  const [usernameCopied, setUsernameCopied] = useState(false)
  const [asset, setAsset] = useState(ALL_DISPLAY_TOKENS.find((t) => t.enabled))
  const [username, setUsername] = useState(null)
  const [usernameLoading, setUsernameLoading] = useState(false)

  const liveAddress = user?.wallet?.address || wallets[0]?.address
  const isEmbedded = user?.wallet?.walletClientType === 'privy'

  const { balances: liveBalances, loading: balancesLoading } = useArcBalances(liveAddress)

  useEffect(() => {
    if (!liveAddress) {
      setUsername(null)
      return
    }
    let cancelled = false
    setUsernameLoading(true)
    getUsernameForAddress(liveAddress)
      .then((u) => { if (!cancelled) setUsername(u) })
      .finally(() => { if (!cancelled) setUsernameLoading(false) })
    return () => { cancelled = true }
  }, [liveAddress])

  const copy = () => {
    if (!liveAddress) return
    navigator.clipboard?.writeText(liveAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const copyUsername = () => {
    if (!username) return
    navigator.clipboard?.writeText(`@${username}`)
    setUsernameCopied(true)
    setTimeout(() => setUsernameCopied(false), 1800)
  }

  return (
    <div className="mx-auto grid max-w-3xl animate-fade-up gap-6 lg:grid-cols-5">
      <div className="glass sheen relative overflow-hidden rounded-4xl p-8 lg:col-span-3">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl animate-float"
          style={{ background: 'conic-gradient(from 90deg, #4FD1C5, #7C6CFF, #4FD1C5)' }}
        />
        <div className="relative flex flex-col items-center text-center">
          <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Your Arc Testnet address</p>

          {!ready ? (
            <div className="mt-6 h-[212px] w-[212px] animate-pulse rounded-3xl bg-white/5" />
          ) : !authenticated || !liveAddress ? (
            <div className="mt-6 flex h-[212px] w-[212px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-6">
              <Wallet size={28} className="text-pearl-faint" strokeWidth={1.6} />
              <p className="text-xs text-pearl-faint">Connect a wallet to get your real receiving address</p>
              <button onClick={openConnectModal} className="btn-primary !px-4 !py-2 text-xs">
                Connect wallet
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white p-4 shadow-panel">
              <QRCodeSVG value={liveAddress} size={180} bgColor="#ffffff" fgColor="#0E0C22" />
            </div>
          )}

          <p className="mt-6 font-display text-lg text-pearl">
            {authenticated ? (user?.email?.address || 'Connected wallet') : 'Not connected'}
          </p>
          <p className="text-sm text-pearl-faint">
            {authenticated ? (isEmbedded ? 'KiteFlowSend embedded wallet' : 'External wallet') : 'Connect to receive funds'}
          </p>

          {authenticated && liveAddress && !usernameLoading && (
            username ? (
              <button
                onClick={copyUsername}
                className="mt-5 flex items-center gap-2 rounded-2xl border border-teal-400/25 bg-teal-400/[0.08] px-4 py-3 text-sm font-medium text-teal-300"
              >
                <AtSign size={14} />
                {username}
                {usernameCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            ) : (
              <button
                onClick={() => onNavigate?.('settings')}
                className="mt-5 flex items-center gap-2 rounded-2xl border border-violet-400/25 bg-violet-500/[0.08] px-4 py-3 text-xs text-violet-300"
              >
                <AtSign size={14} />
                Claim a username so people can send you money by name
                <ArrowRight size={14} />
              </button>
            )
          )}

          {authenticated && liveAddress && (
            <button
              onClick={copy}
              className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-midnight-950/50 px-4 py-3 font-mono text-xs text-pearl-dim"
            >
              {liveAddress}
              {copied ? <Check size={14} className="text-teal-300" /> : <Copy size={14} />}
            </button>
          )}

          <div className="mt-6 flex w-full gap-3">
            <button disabled={!authenticated} className="btn-ghost flex-1 disabled:cursor-not-allowed disabled:opacity-40">
              <Share2 size={16} /> Share link
            </button>
            <button disabled={!authenticated} className="btn-ghost flex-1 disabled:cursor-not-allowed disabled:opacity-40">
              <Copy size={16} /> Save QR
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="glass rounded-3xl p-6">
          <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Receive in</p>
          <div className="mt-3 flex flex-col gap-2">
            {ALL_DISPLAY_TOKENS.map((b) => {
              const isDisabled = b.enabled === false
              return (
                <button
                  key={b.symbol}
                  onClick={() => !isDisabled && setAsset(b)}
                  disabled={isDisabled}
                  className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                    isDisabled
                      ? 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] opacity-40'
                      : asset.symbol === b.symbol
                        ? 'border-violet-400/40 bg-violet-500/[0.08]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <img src={b.logo} alt={b.symbol} className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-pearl">{b.symbol}</p>
                    <p className="text-[11px] text-pearl-faint">{b.name}</p>
                  </div>
                  {isDisabled ? (
                    <span className="chip !border-white/10 !bg-white/[0.05] !px-2 !py-0.5 !text-[10px] !text-pearl-faint">Soon</span>
                  ) : (
                    authenticated && !balancesLoading && (
                      <p className="text-xs text-pearl-faint">
                        {(liveBalances.find((lb) => lb.symbol === b.symbol)?.amount ?? 0).toFixed(4)}
                      </p>
                    )
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 text-sm text-pearl-faint">
          <p className="font-display text-base text-pearl">How it works</p>
          <p className="mt-2 leading-relaxed">
            Share your address, QR code, or username with anyone on Arc Testnet. Funds sent to
            this address settle directly to your KiteFlow wallet — no bridging required. Your
            address works the same way whether you connected an external wallet or created a
            SmarFPay embedded wallet with just your email.
          </p>
        </div>
      </div>
    </div>
  )
}