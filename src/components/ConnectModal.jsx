import React, { useState } from 'react'
import { usePrivy, useLoginWithEmail } from '@privy-io/react-auth'
import { Mail, Wallet, X, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'

export default function ConnectModal({ onClose }) {
  const { connectOrCreateWallet } = usePrivy()
  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: () => onClose(),
  })

  const [step, setStep] = useState('choice') // choice | email | code
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSendCode = async () => {
    if (!email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await sendCode({ email })
      setStep('code')
    } catch (err) {
      setError(err?.message || 'Could not send code.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (code.length < 6) {
      setError('Enter the 6-digit code.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await loginWithCode({ code })
    } catch (err) {
      setError(err?.message || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectWallet = async () => {
    setLoading(true)
    setError(null)
    try {
      // Note: Privy's own connector-selection UI appears briefly here —
      // this specific step isn't documented as whitelabelable.
      await connectOrCreateWallet()
      onClose()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-midnight-950/80 backdrop-blur-md lg:items-center"
      onClick={onClose}
    >
      <div
        className="glass sheen relative w-full max-w-md overflow-hidden rounded-t-4xl p-8 lg:rounded-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl animate-float"
          style={{ background: 'conic-gradient(from 90deg, #7C6CFF, #4FD1C5, #9C8CFF, #7C6CFF)' }}
        />

        <button onClick={onClose} className="absolute right-6 top-6 text-pearl-faint hover:text-pearl">
          <X size={18} />
        </button>

        <div className="relative flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aurora bg-200% animate-aurora-shift shadow-glow-violet">
            <ShieldCheck size={24} className="text-midnight-950" />
          </div>
          <h2 className="mt-5 font-display text-2xl text-pearl">
            {step === 'choice' && 'Welcome to KiteFlow'}
            {step === 'email' && 'Continue with email'}
            {step === 'code' && 'Check your inbox'}
          </h2>
          <p className="mt-2 text-sm text-pearl-faint">
            {step === 'choice' && 'Instant stablecoin transfers on Arc Testnet.'}
            {step === 'email' && "We'll send a one-time code — no password needed."}
            {step === 'code' && <>Enter the code we sent to <span className="text-pearl">{email}</span></>}
          </p>

          {error && <p className="mt-4 text-xs text-red-300">{error}</p>}

          {step === 'choice' && (
            <div className="mt-8 flex w-full flex-col gap-3">
              <button onClick={() => setStep('email')} className="btn-primary w-full justify-center">
                <Mail size={16} /> Continue with email <ArrowRight size={14} />
              </button>
              <button
                onClick={handleConnectWallet}
                disabled={loading}
                className="btn-ghost w-full justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                Connect wallet
              </button>
              <p className="mt-2 text-[11px] text-pearl-faint">
                MetaMask, Rabby, WalletConnect, and other Arc-compatible wallets supported.
              </p>
            </div>
          )}

          {step === 'email' && (
            <div className="mt-8 flex w-full flex-col gap-3">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                placeholder="you@example.com"
                type="email"
                autoFocus
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-pearl placeholder:text-pearl-faint outline-none focus:border-violet-400/40"
              />
              <button onClick={handleSendCode} disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Send code <ArrowRight size={14} /></>}
              </button>
              <button onClick={() => { setStep('choice'); setError(null) }} className="text-xs text-pearl-faint hover:text-pearl">
                ← Back
              </button>
            </div>
          )}

          {step === 'code' && (
            <div className="mt-8 flex w-full flex-col gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                placeholder="000000"
                inputMode="numeric"
                autoFocus
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-center font-display text-2xl tracking-[0.4em] text-pearl placeholder:text-pearl-faint outline-none focus:border-violet-400/40"
              />
              <button onClick={handleVerifyCode} disabled={loading} className="btn-primary w-full justify-center disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Verify <ArrowRight size={14} /></>}
              </button>
              <button onClick={handleSendCode} disabled={loading} className="text-xs text-pearl-faint hover:text-pearl">
                Resend code
              </button>
            </div>
          )}

          <p className="mt-6 text-[11px] text-pearl-faint">Arc Testnet · assets carry no real-world value</p>
        </div>
      </div>
    </div>
  )
}