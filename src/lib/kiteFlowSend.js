// Address of the deployed KiteFlowSend contract on Arc Testnet.
// Set in .env as VITE_KITEFLOW_SEND_ADDRESS — kept out of source so a
// bad/placeholder address never gets silently deployed, same pattern
// as VITE_ARROW_ROUTER_ADDRESS.
import { isValidAddress } from './arrowRouter'

export const KITEFLOW_SEND_ADDRESS = import.meta.env.VITE_KITEFLOW_SEND_ADDRESS || ''

export { isValidAddress }