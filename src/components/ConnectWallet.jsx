import React, { useState, useRef, useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Wallet, Copy, Check, LogOut, ExternalLink, ChevronDown } from 'lucide-react'
import { arcTestnet } from '../lib/arcChain'
import { useConnectModal } from '../lib/connectModalContext'

function short(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function ConnectWallet() {
  const { ready, authenticated, logout, user } = usePrivy()
  const { wallets } = useWallets()
  const { open: openConnectModal } = useConnectModal()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)

  const address = user?.wallet?.address || wallets?.[0]?.address
  const isEmbedded = user?.wallet?.walletClientType === 'privy'

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!ready) {
    return <div className="h-11 w-40 animate-pulse rounded-2xl bg-white/5" />
  }

  if (!authenticated) {
    return (
      <button onClick={openConnectModal} className="btn-primary !px-4 !py-2.5 text-sm">
        <Wallet size={16} strokeWidth={2} />
        Connect wallet
      </button>
    )
  }

  const copy = () => {
    if (!address) return
    navigator.clipboard?.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/3 py-1.5 pl-1.5 pr-3"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-teal-400">
          <Wallet size={14} strokeWidth={2} className="text-midnight-950" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold leading-none text-pearl">{short(address)}</p>
          <p className="mt-1 text-[11px] leading-none text-teal-300">
            {isEmbedded ? 'SmarFPay wallet' : 'External wallet'}
          </p>
        </div>
        <ChevronDown size={14} className="text-pearl-faint" />
      </button>

      {open && (
        <div className="glass absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl p-3">
          <p className="truncate px-1 text-[11px] uppercase tracking-wide text-pearl-faint">
            {user?.email?.address || 'Connected to Arc Testnet'}
          </p>

          <button
            onClick={copy}
            className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 font-mono text-xs text-pearl-dim"
          >
            {short(address)}
            {copied ? <Check size={14} className="text-teal-300" /> : <Copy size={14} />}
          </button>

          <a
            href={`${arcTestnet.blockExplorers.default.url}/address/${address}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-pearl-dim hover:bg-white/5"
          >
            <ExternalLink size={14} />
            View on ArcScan
          </a>

          <button
            onClick={() => {
              logout()
              setOpen(false)
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs text-blush hover:bg-white/5"
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}