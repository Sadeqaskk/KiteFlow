import { useState } from 'react'
import { parseUnits } from 'viem'
import { publicClient } from './publicClient'
import { erc20Abi } from './erc20Abi'
import { kiteFlowSendAbi } from './kiteFlowSendAbi'
import { KITEFLOW_SEND_ADDRESS, isValidAddress } from './kiteFlowSend'
import { useArcWalletClient } from './useArcWalletClient'
import { arcTestnet } from './arcChain'

// token === null      -> native USDC (Arc's gas token, 18 decimals, sendNative)
// token === ARC_TOKENS.EURC (etc.) -> ERC-20, approve then sendToken
export function useKiteFlowSend() {
  const { wallet, getWalletClient } = useArcWalletClient()
  const [status, setStatus] = useState('idle') // idle | approving | sending | success | error
  const [error, setError] = useState(null)
  const [txHash, setTxHash] = useState(null)

  const reset = () => {
    setStatus('idle')
    setError(null)
    setTxHash(null)
  }

  const send = async ({ token, to, amount, memo = '' }) => {
    setError(null)
    setTxHash(null)

    if (!KITEFLOW_SEND_ADDRESS) {
      setStatus('error')
      setError('KiteFlowSend address missing — set VITE_KITEFLOW_SEND_ADDRESS in .env.')
      return
    }
    if (!wallet) {
      setStatus('error')
      setError('Connect a wallet first.')
      return
    }
    if (!isValidAddress(to)) {
      setStatus('error')
      setError('Enter a valid recipient address (0x + 40 hex characters).')
      return
    }
    if (!amount || Number(amount) <= 0) {
      setStatus('error')
      setError('Enter an amount greater than 0.')
      return
    }

    try {
      const isPaused = await publicClient.readContract({
        address: KITEFLOW_SEND_ADDRESS,
        abi: kiteFlowSendAbi,
        functionName: 'paused',
      })
      if (isPaused) {
        setStatus('error')
        setError('KiteFlowSend is currently paused.')
        return
      }

      const walletClient = await getWalletClient()

      if (!token) {
        setStatus('sending')
        const value = parseUnits(amount, arcTestnet.nativeCurrency.decimals)
        const hash = await walletClient.writeContract({
          address: KITEFLOW_SEND_ADDRESS,
          abi: kiteFlowSendAbi,
          functionName: 'sendNative',
          args: [to, memo],
          value,
        })
        await publicClient.waitForTransactionReceipt({ hash })
        setTxHash(hash)
        setStatus('success')
        return
      }

      const amountUnits = parseUnits(amount, token.decimals)
      const owner = wallet.address

      const allowance = await publicClient.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, KITEFLOW_SEND_ADDRESS],
      })

      if (allowance < amountUnits) {
        setStatus('approving')
        const approveHash = await walletClient.writeContract({
          address: token.address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [KITEFLOW_SEND_ADDRESS, amountUnits],
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }

      setStatus('sending')
      const hash = await walletClient.writeContract({
        address: KITEFLOW_SEND_ADDRESS,
        abi: kiteFlowSendAbi,
        functionName: 'sendToken',
        args: [token.address, to, amountUnits, memo],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setTxHash(hash)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err?.shortMessage || err?.message || 'Transaction failed.')
    }
  }

  return { send, status, error, txHash, reset, walletAddress: wallet?.address }
}