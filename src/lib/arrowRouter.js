// Set the real, 40-hex-character ArrowRouter address in .env as
// VITE_ARROW_ROUTER_ADDRESS. Kept out of source so a bad/placeholder
// address never gets silently deployed.
export const ARROW_ROUTER_ADDRESS = import.meta.env.VITE_ARROW_ROUTER_ADDRESS || ''

export function isValidAddress(addr) {
  return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr)
}