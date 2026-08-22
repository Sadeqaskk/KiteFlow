// Calls the server-side /api/agent endpoint — never calls Anthropic
// directly from the browser, so the API key stays server-side.
export async function getAgentReply(messages) {
  const res = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Agent request failed.')
  return data.text
}