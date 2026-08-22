// Arc Testnet ERC-20 token addresses — official, from Circle's own docs:
// https://docs.arc.io/arc/references/contract-addresses
export const ARC_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
    icon: '$',
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    decimals: 6,
    icon: '€',
  },
  // USDT has no official Circle-issued contract on Arc Testnet as of
  // writing. Add its real address here (and uncomment) once you have one
  // to enable it in the Swap screen — do not guess an address.
  // USDT: { symbol: 'USDT', name: 'Tether USD', address: '0x...', decimals: 6, icon: '₮' },
}

export const SWAPPABLE_TOKENS = Object.values(ARC_TOKENS)