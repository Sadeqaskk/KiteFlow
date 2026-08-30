import React, { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import ActivityList from './ActivityList'
import { Sparkles, ArrowUpRight, ArrowDownLeft, X, ExternalLink, Eye } from 'lucide-react'
import { useArcBalances } from '../lib/useArcBalances'
import { ALL_DISPLAY_TOKENS } from '../lib/tokens'
import { useKiteFlowHistory } from '../lib/useKiteFlowHistory'
import { arcTestnet } from '../lib/arcChain'

const agentSuggestions = [
  'Send 50 USDC to a frequent contact every Friday',
  'Swap 20% of new deposits into EURC',
  'Alert me if my balance drops below 100 USDC',
]

export default function Dashboard({ onNavigate }) {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const liveAddress = user?.wallet?.address || wallets[0]?.address
  const isLive = authenticated && Boolean(liveAddress)

  // Single source of truth for all balances (used for total + per-token display)
  const { balances: liveBalances, loading: balancesLoading } = useArcBalances(isLive ? liveAddress : null)
  const total = isLive ? liveBalances.reduce((s, b) => s + b.amount, 0) : 0
  const showSkeleton = isLive && balancesLoading && liveBalances.length === 0

  const { contacts, loading: contactsLoading } = useKiteFlowHistory(isLive ? liveAddress : null)

  const [selected, setSelected] = useState(null)

  return (
    <div className="grid animate-fade-up grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {/* --- Balance card (was BalanceOrb.jsx, now inline) --- */}
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

                {showSkeleton ? (
                  <div className="mt-3 h-12 w-48 animate-pulse rounded-lg bg-white/[0.06]" />
                ) : (
                  <p className="mt-3 font-display text-5xl font-light tracking-tight text-pearl lg:text-6xl">
                    ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}

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
              {showSkeleton ? (
                <>
                  <div className="h-[62px] min-w-[140px] flex-1 animate-pulse rounded-2xl bg-white/[0.03]" />
                  <div className="h-[62px] min-w-[140px] flex-1 animate-pulse rounded-2xl bg-white/[0.03]" />
                  <div className="h-[62px] min-w-[140px] flex-1 animate-pulse rounded-2xl bg-white/[0.03]" />
                </>
              ) : (
                isLive &&
                liveBalances.map((b) => {
                  const tokenMeta = ALL_DISPLAY_TOKENS.find((t) => t.symbol === b.symbol)
                  return (
                    <div
                      key={b.symbol}
                      className="flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5"
                    >
                      {tokenMeta?.logo ? (
                        <img src={tokenMeta.logo} alt={b.symbol} className="h-9 w-9 rounded-full" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/25 to-teal-400/25 font-display text-sm text-pearl">
                          {b.icon}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-pearl">
                          {b.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[11px] text-pearl-faint">{b.symbol}</p>
                      </div>
                    </div>
                  )
                })
              )}

              {isLive && !showSkeleton && (
                <div className="flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 opacity-40">
                  <img
                    src={ALL_DISPLAY_TOKENS.find((t) => t.symbol === 'cirBTC')?.logo}
                    alt="cirBTC"
                    className="h-9 w-9 rounded-full"
                  />
                  <div>
                    <p className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] tracking-wide text-pearl-faint uppercase w-fit">
                      Soon
                    </p>
                    <p className="mt-1 text-[11px] text-pearl-faint">cirBTC</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => onNavigate('send')} className="btn-primary flex-1">
                <ArrowUpRight size={18} strokeWidth={2} />
                Send
              </button>
              <button onClick={() => onNavigate('receive')} className="btn-ghost flex-1">
                <ArrowDownLeft size={18} strokeWidth={2} />
                Receive
              </button>
            </div>
          </div>
        </div>
        {/* --- end balance card --- */}

        <div className="mt-6">
          <ActivityList />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg text-pearl">Frequent contacts</h3>

          {!authenticated && (
            <p className="mt-4 text-xs text-pearl-faint">Connect your wallet to see people you've actually transacted with.</p>
          )}
          {authenticated && contactsLoading && (
            <p className="mt-4 text-xs text-pearl-faint">Loading on-chain history...</p>
          )}
          {authenticated && !contactsLoading && contacts.length === 0 && (
            <p className="mt-4 text-xs text-pearl-faint">
              No payments yet on KiteFlowSend — send or receive once and this fills in automatically.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-3">
            {contacts.map((c) => (
              <button
                key={c.address}
                onClick={() => setSelected(c)}
                className="flex items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${c.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-pearl">
                    {c.username ? `@${c.username}` : `${c.address.slice(0, 6)}...${c.address.slice(-4)}`}
                  </p>
                  <p className="text-xs text-pearl-faint">{c.count} payment{c.count === 1 ? '' : 's'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass sheen relative overflow-hidden rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-300" />
            <h3 className="font-display text-lg text-pearl">Ask your AI agent</h3>
          </div>
          <p className="mt-2 text-sm text-pearl-faint">Automate transfers and swaps with plain language.</p>
          <div className="mt-4 flex flex-col gap-2">
            {agentSuggestions.slice(0, 2).map((s) => (
              <button
                key={s}
                onClick={() => onNavigate('agent')}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-xs text-pearl-dim hover:bg-white/[0.06]"
              >
                {s}
              </button>
            ))}
          </div>
          <button onClick={() => onNavigate('agent')} className="btn-primary mt-4 w-full">
            Open AI Agent
          </button>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-midnight-950/70 backdrop-blur-sm lg:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="glass max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-4xl p-7 lg:rounded-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${selected.color}`} />
                <div>
                  <p className="font-display text-lg text-pearl">
                    {selected.username ? `@${selected.username}` : 'Contact'}
                  </p>
                  <p className="font-mono text-xs text-pearl-faint">
                    {selected.address.slice(0, 6)}...{selected.address.slice(-4)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-pearl-faint hover:text-pearl">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs text-pearl-faint">You sent</p>
                {Object.keys(selected.sentTotals).length === 0
                  ? <p className="mt-1 text-sm text-pearl">—</p>
                  : Object.entries(selected.sentTotals).map(([sym, amt]) => (
                      <p key={sym} className="mt-1 text-sm text-pearl">
                        {amt.toLocaleString(undefined, { maximumFractionDigits: 4 })} {sym}
                      </p>
                    ))}
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs text-pearl-faint">You received</p>
                {Object.keys(selected.receivedTotals).length === 0
                  ? <p className="mt-1 text-sm text-pearl">—</p>
                  : Object.entries(selected.receivedTotals).map(([sym, amt]) => (
                      <p key={sym} className="mt-1 text-sm text-pearl">
                        {amt.toLocaleString(undefined, { maximumFractionDigits: 4 })} {sym}
                      </p>
                    ))}
              </div>
            </div>

            <button
              onClick={() => onNavigate('send', { prefillTo: selected.username ? `@${selected.username}` : selected.address })}
              className="btn-primary mt-5 w-full"
            >
              <ArrowUpRight size={16} /> Send again
            </button>

            <p className="mt-6 text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">History</p>
            <div className="mt-3 flex flex-col gap-2">
              {selected.history.map((h, i) => (
                <a
                  key={i}
                  href={`${arcTestnet.blockExplorers.default.url}/tx/${h.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-xs hover:bg-white/[0.05]"
                >
                  <span className="flex items-center gap-2 text-pearl-dim">
                    {h.direction === 'sent'
                      ? <ArrowUpRight size={12} className="text-violet-300" />
                      : <ArrowDownLeft size={12} className="text-teal-300" />}
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-pearl">
                    {h.direction === 'sent' ? '-' : '+'}
                    {h.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {h.symbol}
                    <ExternalLink size={10} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}