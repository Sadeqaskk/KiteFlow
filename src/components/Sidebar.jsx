import React from 'react'
import {
  LayoutGrid,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Repeat,
  Sparkles,
  Settings,
  Github,
} from 'lucide-react'

const items = [
  { key: 'dashboard', label: 'Overview', icon: LayoutGrid },
  { key: 'send', label: 'Send', icon: ArrowUpRight },
  { key: 'receive', label: 'Receive', icon: ArrowDownLeft },
  { key: 'request', label: 'Request', icon: HandCoins },
  { key: 'swap', label: 'Swap', icon: Repeat },
  { key: 'agent', label: 'AI Agent', icon: Sparkles },
]

// Simple inline X (Twitter) glyph — lucide's Twitter icon is the old bird logo,
// not the current X mark, so this is a small custom SVG instead.
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.6l-5.2-6.8L5.4 22H2.3l8.1-9.3L1.4 2h6.9l4.7 6.2L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z" />
    </svg>
  )
}

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

        {/* Builder / project links */}
        <div className="flex items-center gap-3 px-1">
          <a
            href="https://x.com/0xsadik0"
            target="_blank"
            rel="noreferrer"
            title="@0xsadik0 on X"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-pearl-faint transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-pearl"
          >
            <XIcon className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://github.com/Sadeqaskk/KiteFlow"
            target="_blank"
            rel="noreferrer"
            title="KiteFlowSend on GitHub"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-pearl-faint transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-pearl"
          >
            <Github className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </aside>
  )
}