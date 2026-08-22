import React, { useState } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import BalanceOrb from './BalanceOrb'
import ActivityList from './ActivityList'
import { Sparkles, ArrowUpRight, ArrowDownLeft, X, ExternalLink } from 'lucide-react'
import { useArcBalance } from '../lib/useArcBalance'
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
  const { balance: liveBalance } = useArcBalance(authenticated ? liveAddress : null)
  const { contacts, loading: contactsLoading } = useKiteFlowHistory(authenticated ? liveAddress : null)

  const [selected, setSelected] = useState(null)

  return (
    <div className="grid animate-fade-up grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <BalanceOrb
          onSend={() => onNavigate('send')}
          onReceive={() => onNavigate('receive')}
          liveAddress={authenticated ? liveAddress : null}
          liveBalance={liveBalance}
        />

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