import { useWallets } from '@privy-io/react-auth'
import { createWalletClient, custom } from 'viem'
import { arcTestnet } from './arcChain'

// Returns the connected wallet plus a function that builds a viem
// WalletClient on demand (approve/swap transactions use this to sign
// and send through whichever wallet the user connected — injected,
// WalletConnect, or the SmarFPay embedded wallet — they all expose the
// same EIP-1193 provider interface via Privy).
export function useArcWalletClient() {
  const { wallets } = useWallets()
  const wallet = wallets[0]

  const getWalletClient = async () => {
    if (!wallet) throw new Error('No wallet connected')
    const provider = await wallet.getEthereumProvider()
    return createWalletClient({
      account: wallet.address,
      chain: arcTestnet,
      transport: custom(provider),
    })
  }

  return { wallet, getWalletClient }
}