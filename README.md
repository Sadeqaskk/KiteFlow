# KiteFlow

From SmarFPay to KiteFlow — a new name, a new identity, and a bigger vision.

A premium stablecoin wallet UI for **Arc Testnet** — Send, Receive, Request, Swap
(same-chain, no bridging) and an AI Agent for automating transfers, all wrapped
in a "Midnight Iris" luxury design system.

Built with **React + Vite + Tailwind CSS** — no plain hand-written CSS files;
every color, radius, shadow, gradient and animation lives in `tailwind.config.js`
as reusable design tokens.

## Design direction

- **Palette:** deep violet-indigo ("midnight iris") base — deliberately not
  black, not gold — with pearl neutrals and a signature aurora gradient
  (electric violet → liquid teal) used as the one bold accent.
- **Type:** Fraunces (display serif) for balances and headlines, Inter for UI
  text, JetBrains Mono for addresses and transaction data.
- **Signature element:** the "liquid aurora" balance card — a slowly drifting
  conic-gradient field behind frosted glass, used on the Overview, Receive and
  Swap screens to make the stablecoin balance feel alive rather than a static
  ledger number.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/
    Sidebar.jsx      # left nav (desktop) 
    TopBar.jsx        # header, search, account chip
    BalanceOrb.jsx     # signature liquid-aurora balance card
    ActivityList.jsx   # recent transaction feed
    Dashboard.jsx       # overview screen
    Send.jsx            # send stablecoins to a contact/address
    Receive.jsx         # QR + address to receive funds
    Request.jsx         # request money from a contact
    Swap.jsx             # direct same-chain stablecoin swap (no bridge)
    AIAgent.jsx           # chat-style AI agent for automation
  data/mock.js           # mock balances, contacts, transactions
  index.css               # Tailwind layers + component classes
  App.jsx                  # screen router (simple tab state)
tailwind.config.js          # full design token system
```

## Wiring up Arc Testnet

This build ships with mock data so the UI is fully explorable out of the box.
To connect it to Arc Testnet for real:

1. Add a wallet/provider library (e.g. `viem` or `ethers`) and an Arc Testnet
   RPC endpoint + chain config.
2. Replace `src/data/mock.js` reads with live balance/contact/transaction
   queries.
3. Wire the `Send`, `Request` and `Swap` action buttons to real contract
   calls, and gate the AI Agent's actions behind on-chain confirmation +
   the spend-limit permissions described in the Agent screen.

## Notes

- No black or gold anywhere in the palette by design — the "premium" feel
  comes from the violet/teal aurora gradient, glass depth, and the serif
  display type instead.
- "Swap" is same-chain only, matching the brief (no bridging UI or copy
  anywhere in the product).
