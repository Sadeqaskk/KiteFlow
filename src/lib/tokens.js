// Arc Testnet ERC-20 token addresses — official, from Circle's own docs:
// https://docs.arc.io/arc/references/contract-addresses
// cirBTC address/decimals confirmed via
// https://developers.circle.com/assets/cirbtc-contract-addresses
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
  cirBTC: {
    symbol: 'cirBTC',
    name: 'Circle Wrapped Bitcoin',
    address: '0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF',
    decimals: 8,
    logo: '/cirbtc.png',
  },
  // USDT has no official Circle-issued contract on Arc Testnet as of
  // writing. Add its real address here (and uncomment) once you have one
  // to enable it in the Swap screen — do not guess an address.
  // USDT: { symbol: 'USDT', name: 'Tether USD', address: '0x...', decimals: 6, logo: '/usdt.png' },
}

export const SWAPPABLE_TOKENS = Object.values(ARC_TOKENS)

// Display-only, no longer used now that cirBTC has a confirmed testnet
// contract address above — leave empty until another asset needs staging.
export const COMING_SOON_TOKENS = []

export const ALL_DISPLAY_TOKENS = [
  ...SWAPPABLE_TOKENS.map((t) => ({ ...t, enabled: true })),
  ...COMING_SOON_TOKENS,
]