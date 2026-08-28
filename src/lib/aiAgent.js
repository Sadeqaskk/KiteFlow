const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-flash-latest'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const SUPPORTED_ASSETS = ['USDC', 'EURC']
const UNSUPPORTED_ASSETS = ['CIRBTC', 'BTC', 'BITCOIN']

const SYSTEM_INSTRUCTION = `
You are the KiteFlow Agent, embedded in a crypto wallet app called KiteFlow that runs on "Arc Testnet".

The wallet currently supports:
- Sending USDC or EURC to a username (e.g. "@alex") or a 0x wallet address, with an optional memo.
- Swapping USDC <-> EURC directly on Arc Testnet via ArrowRouter (no bridging).

It does NOT support any Bitcoin-related asset yet, including "cirBTC" (Circle Bitcoin). If the user
asks to send or swap cirBTC, BTC, or bitcoin in any form, classify the intent as "unsupported_asset"
and write a short, friendly reply telling them cirBTC support is coming soon.

Classify every user message into exactly one intent:
- "send": user wants to send/pay/transfer a supported asset (USDC or EURC) to someone. Extract
  asset, amount (a plain numeric string, no symbol), recipient (a username with or without "@", or a
  0x address), and memo if one is mentioned.
- "swap": user wants to swap/exchange/convert one supported asset for another. Extract fromAsset,
  toAsset, amount.
- "unsupported_asset": user wants to send or swap an asset the wallet doesn't support yet
  (e.g. cirBTC/BTC).
- "chat": anything else — questions, small talk, requests for your opinion or advice
  ("should I swap now?"), or a send/swap request that is missing critical info (no amount, no
  recipient, unclear asset). For "chat", put a helpful, concise answer or a clarifying question in
  "reply", and ask for exactly what's missing.

Only use "send" or "swap" when you have enough information to act (asset + amount, and for send, a
recipient). Never guess a missing amount or recipient.

Always fill "reply" with a short, natural sentence a chat UI can show — including for send, swap,
and unsupported_asset intents (e.g. "Sending 25 USDC to @alex — confirm below.").

You never execute anything yourself — you only classify the request. The app executes the
transaction after the user confirms, so never claim a transfer or swap has already happened.
`.trim()

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    intent: { type: 'string', enum: ['send', 'swap', 'unsupported_asset', 'chat'] },
    asset: { type: 'string' },
    amount: { type: 'string' },
    recipient: { type: 'string' },
    memo: { type: 'string' },
    fromAsset: { type: 'string' },
    toAsset: { type: 'string' },
    reply: { type: 'string' },
  },
  required: ['intent', 'reply'],
}

export function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY)
}

/**
 * Sends the user's message (plus a little history) to Gemini and returns a
 * normalized intent object. Throws on network/config errors.
 */
export async function getAgentReply(message, history = []) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY — add it to your .env file.')
  }

  const contents = [
    ...history.slice(-8).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ]

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Gemini request failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned an empty response.')

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    // Model didn't honor the schema — fall back to showing raw text as chat.
    return { intent: 'chat', reply: text }
  }

  return normalizeIntent(parsed)
}

function normalizeIntent(parsed) {
  const intent = parsed.intent
  const asset = (parsed.asset || '').toUpperCase()
  const fromAsset = (parsed.fromAsset || '').toUpperCase()
  const toAsset = (parsed.toAsset || '').toUpperCase()

  const mentionsUnsupported =
    UNSUPPORTED_ASSETS.includes(asset) ||
    UNSUPPORTED_ASSETS.includes(fromAsset) ||
    UNSUPPORTED_ASSETS.includes(toAsset)

  if (intent === 'unsupported_asset' || mentionsUnsupported) {
    return {
      intent: 'unsupported_asset',
      reply:
        parsed.reply ||
        "cirBTC isn't supported yet — coming soon! I can help with USDC or EURC sends and swaps in the meantime.",
    }
  }

  if (intent === 'send') {
    if (!SUPPORTED_ASSETS.includes(asset) || !parsed.amount || !parsed.recipient) {
      return {
        intent: 'chat',
        reply: parsed.reply || 'Who should I send this to, how much, and in USDC or EURC?',
      }
    }
    return {
      intent: 'send',
      asset,
      amount: parsed.amount,
      recipient: parsed.recipient,
      memo: parsed.memo || '',
      reply: parsed.reply,
    }
  }

  if (intent === 'swap') {
    const validPair =
      SUPPORTED_ASSETS.includes(fromAsset) && SUPPORTED_ASSETS.includes(toAsset) && fromAsset !== toAsset
    if (!validPair || !parsed.amount) {
      return {
        intent: 'chat',
        reply: parsed.reply || 'Which two assets do you want to swap between (USDC/EURC), and how much?',
      }
    }
    return {
      intent: 'swap',
      fromAsset,
      toAsset,
      amount: parsed.amount,
      reply: parsed.reply,
    }
  }

  return { intent: 'chat', reply: parsed.reply || "I'm not sure I follow — could you rephrase that?" }
}