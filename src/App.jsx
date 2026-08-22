import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './components/Dashboard'
import Send from './components/Send'
import Receive from './components/Receive'
import Request from './components/Request'
import Swap from './components/Swap'
import AIAgent from './components/AIAgent'
import Settings from './components/Settings'
import {
  LayoutGrid,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Repeat,
  Sparkles,
  Settings as SettingsIcon,
} from 'lucide-react'

const mobileItems = [
  { key: 'dashboard', icon: LayoutGrid },
  { key: 'send', icon: ArrowUpRight },
  { key: 'receive', icon: ArrowDownLeft },
  { key: 'request', icon: HandCoins },
  { key: 'swap', icon: Repeat },
  { key: 'agent', icon: Sparkles },
  { key: 'settings', icon: SettingsIcon },
]

function parsePayLink() {
  const params = new URLSearchParams(window.location.search)
  const to = params.get('to')
  if (!to) return null
  return {
    to,
    amount: params.get('amount') || '',
    token: params.get('token') || 'USDC',
    memo: params.get('memo') || '',
  }
}

export default function App() {
  const [active, setActive] = useState(() => (parsePayLink() ? 'send' : 'dashboard'))
  const [sendPrefill, setSendPrefill] = useState(parsePayLink)

  const handleNavigate = (key, payload) => {
    if (payload?.to) {
      setSendPrefill((prev) => ({ ...prev, ...payload }))
    }
    setActive(key)
  }

  const screens = {
    dashboard: <Dashboard onNavigate={handleNavigate} />,
    send: <Send prefill={sendPrefill} />,
    receive: <Receive onNavigate={handleNavigate} />,
    request: <Request />,
    swap: <Swap />,
    agent: <AIAgent />,
    settings: <Settings />,
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar active={active} onChange={handleNavigate} />

      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar active={active} />
        <main className="flex-1 px-5 py-7 pb-28 lg:px-10 lg:pb-10">{screens[active]}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-white/[0.06] bg-midnight-950/90 px-2 py-2.5 backdrop-blur-xl lg:hidden">
        {mobileItems.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleNavigate(key)}
            className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 ${
              active === key ? 'text-violet-400' : 'text-pearl-faint'
            }`}
          >
            <Icon size={20} strokeWidth={1.8} />
          </button>
        ))}
      </nav>
    </div>
  )
}