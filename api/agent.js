// Server-side only. ANTHROPIC_API_KEY must be set as a plain (non-VITE_)
// environment variable in your hosting provider's dashboard — never in
// .env with a VITE_ prefix, or it gets bundled into the browser JS.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on the server.' })
    return
  }

  const { messages } = req.body || {}
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array required' })
    return
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 400,
        system:
          "You are the KiteFlow agent, a conversational assistant inside a stablecoin wallet app on Arc Testnet. You can help users understand and prepare sends, swaps, and recurring payments in plain language. You do NOT have the ability to execute on-chain transactions yourself in this version — never claim you've sent, swapped, or scheduled anything for real. If asked to do one of these, explain what you'd need from them and point them to the Send/Swap screen to confirm and execute it themselves. Keep replies to 2-3 sentences.",
        messages: messages.map((m) => ({
          role: m.role === 'agent' ? 'assistant' : 'user',
          content: m.text,
        })),
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      res.status(response.status).json({ error: `Anthropic API error: ${errBody}` })
      return
    }

    const data = await response.json()
    const text = data.content?.find((b) => b.type === 'text')?.text || "Sorry, I didn't catch that."
    res.status(200).json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Agent request failed.' })
  }
}