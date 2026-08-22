import React from 'react'
import { Search } from 'lucide-react'
import ConnectWallet from './ConnectWallet'
import NotificationsBell from './NotificationsBell'

const titles = {
  dashboard: ['Overview', 'Your stablecoin balances at a glance'],
  send: ['Send', 'Move stablecoins instantly on Arc Testnet'],
  receive: ['Receive', 'Share your address or a payment link'],
  request: ['Request', 'Ask anyone to pay you in stablecoins'],
  swap: ['Swap', 'Exchange between stablecoins — no bridging'],
  agent: ['AI Agent', 'Automate transfers with natural language'],
  settings: ['Settings', 'Manage your username and wallet'],
}

export default function TopBar({ active }) {
  const [title, subtitle] = titles[active] || titles.dashboard
  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-6 py-5 lg:px-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-medium tracking-tight text-pearl">{title}</h1>
        <p className="mt-0.5 text-sm text-pearl-faint">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-pearl-faint">
          <Search size={16} strokeWidth={1.8} />
          <input
            placeholder="Search contacts, tx hash..."
            className="w-44 bg-transparent text-sm text-pearl placeholder:text-pearl-faint outline-none"
          />
        </div>

        <NotificationsBell />
        <ConnectWallet />
      </div>
    </header>
  )
}