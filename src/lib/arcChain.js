import { defineChain } from 'viem'

// Arc Testnet — Circle's EVM-compatible L1 for stablecoin finance.
// USDC is the native gas token (18 decimals). These are the network's
// real, published parameters as of writing:
// https://docs.arc.io/arc/references/connect-to-arc
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
})