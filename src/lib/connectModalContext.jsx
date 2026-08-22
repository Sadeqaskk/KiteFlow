import React, { createContext, useContext, useState } from 'react'
import ConnectModal from '../components/ConnectModal'

const ConnectModalContext = createContext(null)

export function ConnectModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ConnectModalContext.Provider value={{ open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
      {isOpen && <ConnectModal onClose={() => setIsOpen(false)} />}
    </ConnectModalContext.Provider>
  )
}

export function useConnectModal() {
  const ctx = useContext(ConnectModalContext)
  if (!ctx) throw new Error('useConnectModal must be used within ConnectModalProvider')
  return ctx
}