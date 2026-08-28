import React from 'react'
import {
  LayoutGrid,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Repeat,
  Sparkles,
  Settings,
} from 'lucide-react'

const items = [
  { key: 'dashboard', label: 'Overview', icon: LayoutGrid },
  { key: 'send', label: 'Send', icon: ArrowUpRight },
  { key: 'receive', label: 'Receive', icon: ArrowDownLeft },
  { key: 'request', label: 'Request', icon: HandCoins },
  { key: 'swap', label: 'Swap', icon: Repeat },
  { key: 'agent', label: 'AI Agent', icon: Sparkles },
]

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="hidden lg:flex w-[264px] shrink-0 flex-col justify-between border-r border-white/[0.06] bg-midnight-950/40 px-5 py-7">
      <div>
        <div className="flex items-center gap-2.5 px-2">
          <img
            src="/KiteFlow.png"
            alt="KiteFlowSend"
            className="h-9 w-9 rounded-xl object-cover shadow-glow-violet"
          />
          <div>
            <p className="font-display text-lg leading-none tracking-tight text-pearl">KiteFlow</p>
            <p className="mt-1 text-[11px] font-medium tracking-wide text-pearl-faint">Arc Testnet</p>
          </div>
        </div>

        <nav className="mt-10 flex flex-col gap-1.5">
          {items.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`nav-item ${active === key ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.8} className={active === key ? 'text-violet-400' : ''} />
              <span>{label}</span>
              {active === key && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400 shadow-glow-teal" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => onChange('settings')}
          className={`nav-item ${active === 'settings' ? 'active' : ''}`}
        >
          <Settings size={18} strokeWidth={1.8} className={active === 'settings' ? 'text-violet-400' : ''} />
          <span>Settings</span>
          {active === 'settings' && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400 shadow-glow-teal" />
          )}
        </button>
        <div className="glass rounded-2xl p-4">
          <p className="chip !bg-teal-400/10 !text-teal-300 !border-teal-400/20">Testnet</p>
          <p className="mt-2 text-xs leading-relaxed text-pearl-faint">
            You're transacting on Arc Testnet. Assets carry no real-world value.
          </p>
        </div>
      </div>
    </aside>
  )
}