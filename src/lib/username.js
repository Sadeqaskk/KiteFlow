export function claimMessage(username, address) {
  return `Register SmarFPay username "${username.toLowerCase()}" for ${address}`
}

export async function resolveUsername(username) {
  const res = await fetch(`/api/username?username=${encodeURIComponent(username.toLowerCase())}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Username not found')
  return data.address
}

export async function getUsernameForAddress(address) {
  if (!address) return null
  const res = await fetch(`/api/username?address=${encodeURIComponent(address)}`)
  const data = await res.json()
  if (!res.ok) return null
  return data.username
}

export async function registerUsername({ username, address, signature }) {
  const res = await fetch('/api/username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, address, signature }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed')
  return data
}