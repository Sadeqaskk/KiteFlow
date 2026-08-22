// ABI for KiteFlowSend — only what Send.jsx actually calls (native send,
// ERC-20 send, the paused() guard, and the event for future Activity feed
// use). Matches the verified contract at KITEFLOW_SEND_ADDRESS.
export const kiteFlowSendAbi = [
  {
    inputs: [
      { internalType: 'address payable', name: 'to', type: 'address' },
      { internalType: 'string', name: 'memo', type: 'string' },
    ],
    name: 'sendNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'memo', type: 'string' },
    ],
    name: 'sendToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'address', name: 'token', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'memo', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'paymentId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'PaymentSent',
    type: 'event',
  },
]