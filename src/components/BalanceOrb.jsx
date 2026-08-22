import React from 'react'
import { Eye, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useArcBalances } from '../lib/useArcBalances'

export default function BalanceOrb({ onSend, onReceive, liveAddress, liveBalance }) {
  const isLive = Boolean(liveAddress)
  const { balances: liveBalances } = useArcBalances(isLive ? liveAddress : null)

  const total =
    isLive && liveBalance != null
      ? parseFloat(liveBalance) + liveBalances.filter((b) => b.symbol !== 'USDC').reduce((s, b) => s + b.amount, 0)
      : 0

  return (
    <div className="glass sheen relative overflow-hidden rounded-4xl p-8 lg:p-10">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl animate-float"
        style={{ background: 'conic-gradient(from 90deg, #7C6CFF, #4FD1C5, #9C8CFF, #7C6CFF)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full opacity-40 blur-3xl animate-float"
        style={{ animationDelay: '2s', background: 'conic-gradient(from 220deg, #4FD1C5, #7C6CFF, #4FD1C5)' }}
      />

      <div className="relative flex flex-col gap-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-pearl-faint">
              <span className="text-xs font-medium tracking-[0.14em] uppercase">Total balance</span>
              <Eye size={14} strokeWidth={1.8} />
            </div>
            <p className="mt-3 font-display text-5xl font-light tracking-tight text-pearl lg:text-6xl">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {isLive ? (
              <p className="mt-2 font-mono text-xs text-pearl-faint">{liveAddress}</p>
            ) : (
              <p className="mt-2 text-sm text-pearl-faint">Connect a wallet to see your balance</p>
            )}
          </div>
          <span
            className={`chip ${
              isLive
                ? '!border-teal-400/25 !bg-teal-400/10 !text-teal-300'
                : '!border-violet-400/25 !bg-violet-500/10 !text-violet-300'
            }`}
          >
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${isLive ? 'bg-teal-400' : 'bg-violet-400'}`} />
            {isLive ? 'Live · Arc Testnet' : 'Not connected'}
          </span>
        </div>

        {!isLive && (
          <p className="text-xs text-pearl-faint">Connect a wallet to see your real Arc Testnet balance.</p>
        )}

        <div className="flex flex-wrap gap-3">
          {isLive &&
            liveBalances.map((b) => (
              <div
                key={b.symbol}
                className="flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/25 to-teal-400/25 font-display text-sm text-pearl">
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-pearl">
                    {b.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-pearl-faint">{b.symbol}</p>
                </div>
              </div>
            ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onSend} className="btn-primary flex-1">
            <ArrowUpRight size={18} strokeWidth={2} />
            Send
          </button>
          <button onClick={onReceive} className="btn-ghost flex-1">
            <ArrowDownLeft size={18} strokeWidth={2} />
            Receive
          </button>
        </div>
      </div>
    </div>
  )
}