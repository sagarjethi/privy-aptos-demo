# Privy x Aptos Demo

A comprehensive Next.js demo application showcasing Aptos blockchain integration with Privy authentication. This project demonstrates how to build Web3 applications on Aptos using Privy's embedded wallet solution.

## 🚀 Features

- **Privy Authentication** - Multiple login methods (email, SMS, social, wallet)
- **Aptos Wallet Integration** - Create and manage Aptos wallets seamlessly
- **Transaction Signing** - Raw hash signing for Aptos transactions
- **Smart Contract Interaction** - Interact with Aptos smart contracts
- **Coin Flip Game** - Interactive demo game with pot system
- **Movement Testnet Support** - Send transactions on Movement network
- **Real-time Balance Updates** - Automatic wallet balance monitoring
- **Type-Safe** - Full TypeScript support with proper types

## 📋 Tech Stack

- **Framework**: Next.js 15.5.6 (App Router)
- **Authentication**: Privy (@privy-io/react-auth)
- **Blockchain**: Aptos (@aptos-labs/ts-sdk)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sagarjethi/privy-aptos-demo.git
cd privy-aptos-demo
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your Privy App ID to `.env.local`:
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

Get your Privy App ID from [Privy Dashboard](https://dashboard.privy.io).

### Running the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
pnpm start
```

## 📁 Project Structure

```
privy-aptos-demo/
├── docs/                          # Documentation
│   ├── README.md                 # Documentation index
│   ├── APTOS_CODE_SNIPPETS.md    # Copy-paste code snippets
│   ├── APTOS_DEMO_FEATURES.md    # Features documentation
│   └── APTOS_FUNCTIONS_EXAMPLES.md # Function examples
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── page.tsx             # Coin flip game page
│   │   ├── movement-tx/         # Movement testnet transaction page
│   │   ├── providers.tsx        # Privy provider setup
│   │   └── layout.tsx           # Root layout
│   └── lib/                      # Utility functions
│       ├── aptos-utils.ts       # Aptos utility functions
│       └── aptos-hooks.ts       # Custom React hooks
├── .env.example                  # Environment variables template
└── package.json
```

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Code Snippets](./docs/APTOS_CODE_SNIPPETS.md)** - Copy-paste ready code snippets for Aptos integration
- **[Demo Features](./docs/APTOS_DEMO_FEATURES.md)** - Complete list of features and functions
- **[Function Examples](./docs/APTOS_FUNCTIONS_EXAMPLES.md)** - Detailed examples of all Aptos functions

## 🎮 Demo Pages

### 1. Coin Flip Game (`/`)
- Interactive coin flip game with pot system
- Bet 0.01 APT and win the entire pot
- Real-time pot balance updates
- Transaction status tracking

### 2. Movement Testnet Transaction (`/movement-tx`)
- Send MOVE tokens on Movement testnet
- Transfer tokens to any address
- Real-time balance monitoring
- Transaction explorer links

## 🔧 Key Features Implementation

### Authentication
- Multiple login methods via Privy
- Embedded wallet creation
- User session management

### Wallet Management
- Create Aptos wallets on-demand
- Display wallet address and balance
- Real-time balance updates

### Transaction Handling
- Build Aptos transactions
- Sign transactions with raw hash signing
- Submit and wait for confirmation
- Error handling and status updates

### Smart Contract Interaction
- Call view functions (read-only)
- Call contract functions (write)
- Type-safe contract calls

## 🛠️ Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## 🔐 Environment Variables

Create a `.env.local` file with:

```env
# Required
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Optional
# NEXT_PUBLIC_APTOS_NETWORK=TESTNET
# NEXT_PUBLIC_APTOS_RPC_URL=https://fullnode.testnet.aptoslabs.com/v1
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

## 📖 Usage Examples

### Create Aptos Wallet

```typescript
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";

const { createWallet } = useCreateWallet();

const wallet = await createWallet({
  chainType: "aptos",
});
```

### Send Transaction

See [docs/APTOS_CODE_SNIPPETS.md](./docs/APTOS_CODE_SNIPPETS.md) for complete examples.

## 🧩 Custom Hooks

The project includes reusable hooks:

- `useAptosWallet()` - Get Aptos wallet from Privy user
- `useAptosBalance()` - Get and monitor wallet balance

## 🎨 UI Components

- Responsive design with Tailwind CSS
- Loading states and error handling
- Transaction status indicators
- Explorer links for transactions

## 🔗 Useful Links

- [Aptos Documentation](https://aptos.dev/)
- [Privy Documentation](https://docs.privy.io/)
- [Aptos TypeScript SDK](https://aptos-labs.github.io/ts-sdk/)
- [Aptos Explorer](https://explorer.aptoslabs.com/)

## 🚀 Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sagarjethi/privy-aptos-demo)

## 📝 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Important Notes

- **Testnet Only**: This demo uses Aptos testnet. Never use real funds in development.
- **Security**: Never expose private keys in client-side code
- **Environment Variables**: Keep your `.env.local` file secure and never commit it

## 📞 Support

For issues and questions:
- Check the [documentation](./docs/)
- Review [code snippets](./docs/APTOS_CODE_SNIPPETS.md)
- Open an issue on GitHub

---

Built with ❤️ using Next.js, Privy, and Aptos
