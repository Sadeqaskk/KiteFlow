import React, { useState, useRef, useEffect } from 'react'
import { Bell, ArrowDownLeft, HandCoins, ExternalLink, BellRing } from 'lucide-react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useKiteFlowNotifications } from '../lib/useKiteFlowNotifications'
import { arcTestnet } from '../lib/arcChain'
import { isPushSupported, getPushSubscriptionState, subscribeToPush } from '../lib/pushNotifications'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NotificationsBell() {
  const { user } = usePrivy()
  const { wallets } = useWallets()
  const address = user?.wallet?.address || wallets[0]?.address

  const { notifications, unreadCount, markAllRead } = useKiteFlowNotifications(address)
  const [open, setOpen] = useState(false)
  const [pushState, setPushState] = useState('unknown')
  const menuRef = useRef(null)

  useEffect(() => {
    if (!address) return
    if (!isPushSupported()) {
      setPushState('unsupported')
      return
    }
    getPushSubscriptionState().then(setPushState)
  }, [address])

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) markAllRead()
  }

  const handleEnablePush = async () => {
    if (!address) return
    try {
      await subscribeToPush(address)
      setPushState('subscribed')
    } catch {
      setPushState('unsubscribed')
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-pearl-dim hover:text-pearl"
      >
        <Bell size={17} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blush px-1 text-[10px] font-semibold text-midnight-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass absolute right-0 top-full z-30 mt-2 w-80 rounded-2xl p-3">
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-xs font-medium tracking-wide text-pearl-faint uppercase">Notifications</p>
            {pushState === 'unsubscribed' && (
              <button onClick={handleEnablePush} className="flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200">
                <BellRing size={12} /> Enable push
              </button>
            )}
            {pushState === 'subscribed' && <span className="text-[11px] text-teal-300">Push on</span>}
          </div>

          {!address && <p className="px-1 py-3 text-xs text-pearl-faint">Connect your wallet to see notifications.</p>}
          {address && notifications.length === 0 && (
            <p className="px-1 py-3 text-xs text-pearl-faint">Nothing yet — this fills in from real on-chain activity.</p>
          )}

          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {notifications.map((n) => (
              <a
                key={n.id}
                href={n.txHash ? `${arcTestnet.blockExplorers.default.url}/tx/${n.txHash}` : undefined}
                target={n.txHash ? '_blank' : undefined}
                rel="noreferrer"
                className="flex items-start gap-2.5 rounded-xl px-2 py-2.5 text-left hover:bg-white/[0.04]"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05]">
                  {n.type === 'payment_received'
                    ? <ArrowDownLeft size={13} className="text-teal-300" />
                    : <HandCoins size={13} className="text-amber" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-pearl">{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-pearl-faint">{timeAgo(n.timestamp)}</p>
                </div>
                {n.txHash && <ExternalLink size={11} className="mt-1 shrink-0 text-pearl-faint" />}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}