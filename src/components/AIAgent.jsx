import React, { useState, useRef, useEffect } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { usePrivy } from '@privy-io/react-auth'
import {
  Sparkles,
  Send as SendIcon,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { getAgentReply, isGeminiConfigured } from '../lib/aiAgent'
import { useArcWalletClient } from '../lib/useArcWalletClient'
import { useKiteFlowSend } from '../lib/useKiteFlowSend'
import { isValidAddress as isValidSendAddress } from '../lib/kiteFlowSend'
import { resolveUsername } from '../lib/username'
import { ARC_TOKENS, SWAPPABLE_TOKENS } from '../lib/tokens'
import { ARROW_ROUTER_ADDRESS, isValidAddress as isValidRouterAddress } from '../lib/arrowRouter'
import { arrowRouterAbi } from '../lib/arrowRouterAbi'
import { erc20Abi } from '../lib/erc20Abi'
import { publicClient } from '../lib/publicClient'
import { arcTestnet } from '../lib/arcChain'

const SLIPPAGE_BPS = 50n

const initialMessages = [
  {
    role: 'agent',
    text: 'Hi, I\'m your KiteFlow agent. Try "send 25 USDC to @alex" or "swap 50 USDC to EURC" — I\'ll get it ready and you confirm in your wallet.',
  },
]

const agentSuggestions = [
  'Send 25 USDC to @alex',
  'Swap 50 USDC to EURC',
  'Send 10 cirBTC to @sam',
  'What can you do?',
]

function findToken(symbol) {
  return SWAPPABLE_TOKENS.find((t) => t.symbol === symbol)
}

export default function AIAgent() {
  const { authenticated, login } = usePrivy()
  const { wallet, getWalletClient } = useArcWalletClient()
  const address = wallet?.address

  const {
    send: sendPayment,
    status: sendStatus,
    error: sendError,
    txHash: sendTxHash,
    reset: resetSendHook,
  } = useKiteFlowSend()

  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [pending, setPending] = useState(null) // { type: 'send' | 'swap', ...details }

  const [swapStatus, setSwapStatus] = useState('idle') // idle | approving | sending | success | error
  const [swapError, setSwapError] = useState('')
  const [swapTxHash, setSwapTxHash] = useState('')

  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, pending, sendStatus, swapStatus])

  const pushAgentMessage = (text) => setMessages((m) => [...m, { role: 'agent', text }])

  const clearPending = () => {
    setPending(null)
    setSwapStatus('idle')
    setSwapError('')
    setSwapTxHash('')
    resetSendHook?.()
  }

  const handleSend = async (text) => {
    const value = (text ?? input).trim()
    if (!value || thinking) return

    setMessages((m) => [...m, { role: 'user', text: value }])
    setInput('')
    setThinking(true)

    try {
      const history = messages.slice(-8)
      const result = await getAgentReply(value, history)

      if (result.reply) pushAgentMessage(result.reply)

      if (result.intent === 'send') {
        await prepareSend(result)
      } else if (result.intent === 'swap') {
        await prepareSwap(result)
      }
      // 'chat' and 'unsupported_asset' intents are fully handled by the reply text above.
    } catch (err) {
      pushAgentMessage(`Something went wrong talking to the agent: ${err.message}`)
    } finally {
      setThinking(false)
    }
  }

  const prepareSend = async (result) => {
    if (!address) {
      pushAgentMessage('Connect your wallet first and I can send that for you.')
      return
    }

    const raw = result.recipient.trim()
    let resolvedAddress = null

    if (isValidSendAddress(raw)) {
      resolvedAddress = raw
    } else {
      const username = raw.replace(/^@/, '').toLowerCase()
      try {
        resolvedAddress = await resolveUsername(username)
      } catch {
        pushAgentMessage(`I couldn't find a wallet for "${raw}" — check the username or paste a 0x address.`)
        return
      }
    }

    if (!resolvedAddress) {
      pushAgentMessage(`I couldn't resolve "${raw}" to a wallet address.`)
      return
    }

    resetSendHook?.()
    setPending({
      type: 'send',
      asset: result.asset,
      amount: result.amount,
      memo: result.memo || '',
      recipientDisplay: raw,
      resolvedAddress,
    })
  }

  const prepareSwap = async (result) => {
    if (!address) {
      pushAgentMessage('Connect your wallet first and I can run that swap for you.')
      return
    }

    const fromToken = findToken(result.fromAsset)
    const toToken = findToken(result.toAsset)
    if (!fromToken || !toToken) {
      pushAgentMessage(`I can only swap between ${SWAPPABLE_TOKENS.map((t) => t.symbol).join(' and ')} right now.`)
      return
    }

    if (!isValidRouterAddress(ARROW_ROUTER_ADDRESS)) {
      pushAgentMessage("The swap router isn't configured yet, so I can't quote that swap.")
      return
    }

    let amountInWei
    try {
      amountInWei = parseUnits(result.amount, fromToken.decimals)
    } catch {
      pushAgentMessage(`"${result.amount}" doesn't look like a valid amount.`)
      return
    }

    try {
      const [path, , amountOut] = await publicClient.readContract({
        address: ARROW_ROUTER_ADDRESS,
        abi: arrowRouterAbi,
        functionName: 'getBestPath',
        args: [fromToken.address, toToken.address, amountInWei],
      })
      const priceImpactBps = await publicClient.readContract({
        address: ARROW_ROUTER_ADDRESS,
        abi: arrowRouterAbi,
        functionName: 'getPriceImpactBps',
        args: [fromToken.address, toToken.address, amountInWei],
      })

      const minAmountOut = (amountOut * (10000n - SLIPPAGE_BPS)) / 10000n

      setSwapStatus('idle')
      setSwapError('')
      setSwapTxHash('')
      setPending({
        type: 'swap',
        fromToken,
        toToken,
        amount: result.amount,
        amountInWei,
        amountOut,
        minAmountOut,
        priceImpactBps,
        path,
      })
    } catch {
      pushAgentMessage(`No route found to swap ${result.amount} ${result.fromAsset} to ${result.toAsset} right now.`)
    }
  }

  const confirmSend = () => {
    if (!pending || pending.type !== 'send') return
    const tokenArg = pending.asset === 'USDC' ? null : ARC_TOKENS.EURC
    sendPayment({
      token: tokenArg,
      to: pending.resolvedAddress,
      amount: pending.amount,
      memo: pending.memo,
    })
  }

  const confirmSwap = async () => {
    if (!pending || pending.type !== 'swap') return
    setSwapError('')
    try {
      const walletClient = await getWalletClient()

      const allowance = await publicClient.readContract({
        address: pending.fromToken.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, ARROW_ROUTER_ADDRESS],
      })

      if (allowance < pending.amountInWei) {
        setSwapStatus('approving')
        const approveHash = await walletClient.writeContract({
          address: pending.fromToken.address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [ARROW_ROUTER_ADDRESS, pending.amountInWei],
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }

      setSwapStatus('sending')
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
      const swapHash = await walletClient.writeContract({
        address: ARROW_ROUTER_ADDRESS,
        abi: arrowRouterAbi,
        functionName: 'swapExactTokensForTokens',
        args: [pending.fromToken.address, pending.toToken.address, pending.amountInWei, pending.minAmountOut, address, deadline],
      })
      setSwapTxHash(swapHash)
      await publicClient.waitForTransactionReceipt({ hash: swapHash })
      setSwapStatus('success')
    } catch (err) {
      setSwapStatus('error')
      setSwapError(err?.shortMessage || err?.message || 'Swap failed.')
    }
  }

  const handleConfirm = () => {
    if (pending?.type === 'send') confirmSend()
    if (pending?.type === 'swap') confirmSwap()
  }

  const handleCancel = () => {
    pushAgentMessage('No problem, cancelled that.')
    clearPending()
  }

  const activeStatus = pending?.type === 'send' ? sendStatus : swapStatus
  const activeError = pending?.type === 'send' ? sendError : swapError
  const activeHash = pending?.type === 'send' ? sendTxHash : swapTxHash
  const isBusy = activeStatus === 'approving' || activeStatus === 'sending'
  const isDone = activeStatus === 'success'

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

        {!isGeminiConfigured() && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-amber">
            <AlertCircle size={12} /> Missing VITE_GEMINI_API_KEY — add it to your .env to enable the agent.
          </p>
        )}

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

            {thinking && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-pearl-faint">
                  Thinking...
                </div>
              </div>
            )}

            {pending && (
              <div className="flex justify-start">
                <div className="glass max-w-[85%] rounded-2xl border border-violet-400/20 p-4 text-sm text-pearl-dim">
                  {pending.type === 'send' ? (
                    <>
                      <p className="font-medium text-pearl">
                        Send {pending.amount} {pending.asset}
                      </p>
                      <p className="mt-1 text-xs text-pearl-faint">
                        To {pending.recipientDisplay} ({pending.resolvedAddress.slice(0, 6)}...{pending.resolvedAddress.slice(-4)})
                      </p>
                      {pending.memo && <p className="mt-1 text-xs text-pearl-faint">Memo: {pending.memo}</p>}
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-pearl">
                        Swap {pending.amount} {pending.fromToken.symbol} → {formatUnits(pending.amountOut, pending.toToken.decimals)}{' '}
                        {pending.toToken.symbol}
                      </p>
                      <p className="mt-1 text-xs text-pearl-faint">
                        Price impact: {(Number(pending.priceImpactBps) / 100).toFixed(2)}%
                      </p>
                    </>
                  )}

                  {activeError && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
                      <AlertCircle size={12} /> {activeError}
                    </p>
                  )}

                  {isDone ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-teal-300">
                      <CheckCircle2 size={14} /> Done.
                      {activeHash && (
                        <a
                          href={`${arcTestnet.blockExplorers.default.url}/tx/${activeHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 underline"
                        >
                          View on ArcScan <ExternalLink size={12} />
                        </a>
                      )}
                    </p>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleConfirm}
                        disabled={isBusy}
                        className="btn-primary !px-3 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {activeStatus === 'approving' ? 'Approving...' : activeStatus === 'sending' ? 'Sending...' : 'Confirm'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isBusy}
                        className="btn-ghost !px-3 !py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        {!authenticated ? (
          <button onClick={login} className="btn-primary mt-2 w-full">
            Connect wallet
          </button>
        ) : (
          <div className="flex items-center gap-2 border-t border-white/[0.06] pt-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your agent to send, swap, or automate..."
              disabled={thinking}
              className="input-luxe !py-3"
            />
            <button onClick={() => handleSend()} disabled={thinking} className="btn-primary !px-4 !py-3.5 disabled:opacity-40">
              <SendIcon size={16} />
            </button>
          </div>
        )}
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
                onClick={() => handleSend(s)}
                disabled={thinking}
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
            The agent can send USDC/EURC and run USDC ↔ EURC swaps directly — you'll always confirm
            each step in your wallet before anything is signed. cirBTC support is coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}