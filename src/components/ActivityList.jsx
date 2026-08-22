import React from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { ArrowUpRight, ArrowDownLeft, Repeat, HandCoins, Sparkles } from 'lucide-react'
import { useArcActivity } from '../lib/useArcActivity'

const iconFor = {
  send: { Icon: ArrowUpRight, tone: 'text-blush', bg: 'bg-blush/10' },
  receive: { Icon: ArrowDownLeft, tone: 'text-teal-300', bg: 'bg-teal-400/10' },
  swap: { Icon: Repeat, tone: 'text-violet-300', bg: 'bg-violet-500/10' },
  request: { Icon: HandCoins, tone: 'text-amber', bg: 'bg-amber/10' },
  agent: { Icon: Sparkles, tone: 'text-violet-300', bg: 'bg-violet-500/10' },
}

export default function ActivityList() {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const address = user?.wallet?.address || wallets[0]?.address
  const { transactions, loading } = useArcActivity(authenticated ? address : null)

  return (
    <div className="glass rounded-3xl p-6 lg:p-7">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-pearl">Recent activity</h3>
        <button className="text-xs font-medium text-violet-300 hover:text-violet-200">View all</button>
      </div>

      <div className="mt-5 flex flex-col divide-y divide-white/[0.06]">
        {!authenticated && (
          <p className="py-6 text-center text-sm text-pearl-faint">Connect a wallet to see your activity.</p>
        )}
        {authenticated && loading && transactions.length === 0 && (
          <p className="py-6 text-center text-sm text-pearl-faint">Loading recent activity…</p>
        )}
        {authenticated && !loading && transactions.length === 0 && (
          <p className="py-6 text-center text-sm text-pearl-faint">No recent transactions in the scanned window.</p>
        )}
        {transactions.map((tx) => {
          const { Icon, tone, bg } = iconFor[tx.type] || iconFor.send
          const positive = tx.amount > 0
          return (
            <div key={tx.id} className="flex items-center gap-4 py-3.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bg}`}>
                <Icon size={16} strokeWidth={2} className={tone} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-pearl">{tx.name}</p>
                <p className="text-xs text-pearl-faint">Block #{tx.blockNumber?.toString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${positive ? 'text-teal-300' : 'text-pearl'}`}>
                  {positive ? '+' : ''}
                  {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {tx.symbol}
                </p>
                <p className="text-[11px] text-pearl-faint">{tx.status}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}