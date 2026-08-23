// Arc Testnet ERC-20 token addresses — official, from Circle's own docs:
// https://docs.arc.io/arc/references/contract-addresses
export const ARC_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
    logo: '/usdc.png',
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    decimals: 6,
    logo: '/eurc.png',
  },
  // USDT has no official Circle-issued contract on Arc Testnet as of
  // writing. Add its real address here (and uncomment) once you have one
  // to enable it in the Swap screen — do not guess an address.
  // USDT: { symbol: 'USDT', name: 'Tether USD', address: '0x...', decimals: 6, logo: '/usdt.png' },
}

export const SWAPPABLE_TOKENS = Object.values(ARC_TOKENS)

// Display-only — no public Circle-issued contract address on Arc Testnet
// yet, so this is never used for balances, sends, or swaps. Shown in
// selectors as a disabled "Soon" entry until a real address exists.
export const COMING_SOON_TOKENS = [
  { symbol: 'cirBTC', name: 'Circle Bitcoin', logo: '/cirbtc.png', enabled: false },
]

export const ALL_DISPLAY_TOKENS = [
  ...SWAPPABLE_TOKENS.map((t) => ({ ...t, enabled: true })),
  ...COMING_SOON_TOKENS,
]