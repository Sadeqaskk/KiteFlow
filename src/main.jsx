import React from 'react'
import ReactDOM from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import App from './App.jsx'
import { arcTestnet } from './lib/arcChain'
import { ConnectModalProvider } from './lib/connectModalContext'
import './index.css'

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#7C6CFF',
          walletChainType: 'ethereum-only',
        },
        loginMethods: ['email', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        walletConnectCloudProjectId: walletConnectProjectId,
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
      }}
    >
      <ConnectModalProvider>
        <App />
      </ConnectModalProvider>
    </PrivyProvider>
  </React.StrictMode>,
)