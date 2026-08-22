import { createPublicClient, http, formatUnits } from 'viem'
import { arcTestnet } from './arcChain'

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
})

// On Arc, USDC is the native gas token, so a normal native balance read
// returns the wallet's spendable USDC directly — no ERC-20 contract call.
export async function getLiveUsdcBalance(address) {
  const balanceWei = await publicClient.getBalance({ address })
  return formatUnits(balanceWei, arcTestnet.nativeCurrency.decimals)
}