import React, { useEffect, useState } from 'react'
import { AtSign, Wallet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useArcWalletClient } from '../lib/useArcWalletClient'
import { arcTestnet } from '../lib/arcChain'
import { claimMessage, getUsernameForAddress, registerUsername } from '../lib/username'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function Settings() {
  const { wallet, getWalletClient } = useArcWalletClient()
  const address = wallet?.address

  const [currentUsername, setCurrentUsername] = useState(null)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | success | error
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!address) {
      setCurrentUsername(null)
      return
    }
    getUsernameForAddress(address).then(setCurrentUsername)
  }, [address])

  const valid = USERNAME_RE.test(input.toLowerCase())

  const handleSave = async () => {
    if (!address || !valid) return
    setStatus('saving')
    setError(null)
    try {
      const walletClient = await getWalletClient()
      const message = claimMessage(input, address)
      const signature = await walletClient.signMessage({ account: address, message })
      const result = await registerUsername({ username: input, address, signature })
      setCurrentUsername(result.username)
      setInput('')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Could not save username.')
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl animate-fade-up gap-6 lg:grid-cols-5">
      <div className="glass rounded-4xl p-7 lg:col-span-3">
        <p className="flex items-center gap-1.5 text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">
          <AtSign size={12} /> Username
        </p>
        <p className="mt-2 text-sm text-pearl-faint">
          Let people send you USDC or EURC using a name instead of your full address.
        </p>

        {currentUsername && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-teal-400/20 bg-teal-400/[0.06] px-4 py-3 text-sm text-teal-300">
            <CheckCircle2 size={16} /> Your username is <span className="font-mono">@{currentUsername}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="text-pearl-faint">@</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder={currentUsername || 'yourname'}
            maxLength={20}
            className="w-full bg-transparent text-sm text-pearl placeholder:text-pearl-faint outline-none"
          />
        </div>
        {input.length > 0 && !valid && (
          <p className="mt-2 text-xs text-red-300">3-20 characters: lowercase letters, numbers, underscores.</p>
        )}
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
            <AlertCircle size={12} /> {error}
          </p>
        )}
        {!address && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] px-4 py-3 text-xs text-pearl-faint">
            <Wallet size={14} className="text-violet-300" /> Connect your wallet to claim a username.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={!address || !valid || status === 'saving'}
          className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'saving' ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Confirm in wallet...
            </>
          ) : (
            'Save username'
          )}
        </button>
      </div>

      <div className="glass rounded-4xl p-7 lg:col-span-2">
        <p className="text-xs font-medium tracking-[0.14em] text-pearl-faint uppercase">Wallet</p>
        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-pearl-faint">
          <div className="flex justify-between py-1.5">
            <span>Address</span>
            <span className="font-mono text-pearl">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '—'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span>Network</span>
            <span className="text-pearl">{arcTestnet.name}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-pearl-faint">
          Manage connection and switch wallets from your wallet provider directly.
        </p>
      </div>
    </div>
  )
}