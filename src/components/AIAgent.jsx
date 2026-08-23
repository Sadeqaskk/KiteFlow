import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, Send as SendIcon, Zap, ShieldCheck, AlertCircle } from 'lucide-react'
import { getAgentReply } from '../lib/aiAgent'

const initialMessages = [
  {
    role: 'agent',
    text: "Hi, I'm your KiteFlow agent. I can help you think through sends, swaps, or recurring stablecoin payments on Arc Testnet — just tell me what you need.",
  },
]

const agentSuggestions = [
  'Help me send 250 USDC to a friend',
  'Should I swap USDC to EURC right now?',
  'How would a recurring payment work?',
  'Summarize what you can and can\'t do yet',
]

export default function AIAgent() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const value = (text ?? input).trim()
    if (!value || loading) return

    const next = [...messages, { role: 'user', text: value }]
    setMessages(next)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const reply = 'Thanks you for your interest, AI agent is Coming soon'
      setMessages((m) => [...m, { role: 'agent', text: reply }])
    } catch (err) {
      setError(err.message || 'The agent is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl animate-fade-up gap-6 lg:grid-cols-5">
      <div className="glass flex h-[560px] flex-col rounded-4xl p-6 lg:col-span-3">
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aurora bg-200% animate-aurora-shift">
            <Sparkles size={16} className="text-midnight-950" />
          </div>
          <div>
            <p className="text-sm font-semibold text-pearl">KiteFlow Agent</p>
            <p className="flex items-center gap-1 text-[11px] text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" /> Online · Arc Testnet
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-aurora text-midnight-950 font-medium'
                      : 'border border-white/[0.06] bg-white/[0.03] text-pearl-dim'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-pearl-faint">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 pb-2 text-xs text-red-300">
            <AlertCircle size={12} /> {error}
          </p>
        )}

        <div className="flex items-center gap-2 border-t border-white/[0.06] pt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask your agent to send, swap, or automate..."
            disabled={loading}
            className="input-luxe !py-3"
          />
          <button onClick={() => send()} disabled={loading} className="btn-primary !px-4 !py-3.5 disabled:opacity-40">
            <SendIcon size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <div className="glass rounded-3xl p-6">
          <p className="flex items-center gap-1.5 text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">
            <Zap size={12} /> Try asking
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {agentSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left text-xs text-pearl-dim hover:bg-white/[0.06] disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-6 text-sm text-pearl-faint">
          <p className="flex items-center gap-1.5 font-display text-base text-pearl">
            <ShieldCheck size={16} className="text-teal-300" /> Agent permissions
          </p>
          <p className="mt-2 leading-relaxed">
            The agent can talk through sends, swaps, and automations, but it doesn't execute
            transactions on your behalf yet — you'll always confirm and send from the Send/Swap
            screens yourself.
          </p>
        </div>
      </div>
    </div>
  )
}