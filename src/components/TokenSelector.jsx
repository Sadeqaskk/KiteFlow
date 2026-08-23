import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { ALL_DISPLAY_TOKENS } from '../lib/tokens'

export default function TokenSelector({ value, onChange, exclude, tokens = ALL_DISPLAY_TOKENS }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selected = tokens.find((t) => t.symbol === value?.symbol) || value

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="chip flex shrink-0 items-center gap-1.5 !pr-2">
        {selected?.logo && <img src={selected.logo} alt={selected.symbol} className="h-4 w-4 rounded-full" />}
        {selected?.symbol || 'Select'}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="glass absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl p-2">
          {tokens.map((t) => {
            const isExcluded = exclude === t.symbol
            const isDisabled = t.enabled === false || isExcluded
            return (
              <button
                key={t.symbol}
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return
                  onChange(t)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  isDisabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/[0.05]'
                }`}
              >
                <img src={t.logo} alt={t.symbol} className="h-7 w-7 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-pearl">{t.symbol}</p>
                  <p className="text-[11px] text-pearl-faint">{t.name}</p>
                </div>
                {t.enabled === false && (
                  <span className="chip !border-white/10 !bg-white/[0.05] !px-2 !py-0.5 !text-[10px] !text-pearl-faint">
                    Soon
                  </span>
                )}
                {selected?.symbol === t.symbol && !isDisabled && <Check size={14} className="text-teal-300" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}