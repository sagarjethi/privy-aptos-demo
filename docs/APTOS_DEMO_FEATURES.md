# Aptos Demo Features & Functions

This document lists all the features and functions available in the Privy x Aptos demo application.

## 🔐 Authentication Features

### Login Methods
- **Email Login** - Traditional email/password authentication
- **SMS Login** - Phone number-based authentication
- **Wallet Login** - Connect external wallets (Petra, Pontem, etc.)
- **Social Logins**:
  - Google
  - Twitter/X
  - GitHub
  - Apple
  - Discord

### User Management
- `login()` - Authenticate user with Privy
- `logout()` - Sign out and clear session
- `user` - Current authenticated user object
- `authenticated` - Boolean indicating auth status
- `ready` - Boolean indicating if Privy is initialized

## 💼 Wallet Features

### Aptos Wallet Creation
- `createWallet({ chainType: "aptos" })` - Create embedded Aptos wallet
- Auto wallet creation on first login (configurable)
- Support for multiple Aptos wallets per user

### Wallet Information
- **Address** - Aptos account address (0x...)
- **Public Key** - Ed25519 public key for signing
- **Balance** - APT balance in octas and APT units
- **Chain Type** - "aptos" identifier

## 🔐 Signing & Transactions

### Raw Hash Signing
- `signRawHash({ address, chainType: "aptos", hash })` - Sign transaction hashes
- Ed25519 signature support
- Transaction message generation

### Transaction Building
- `aptos.transaction.build.simple()` - Build Aptos transactions
- Support for:
  - Smart contract calls
  - Coin transfers
  - Custom Move function calls
  - Type arguments and function arguments

### Transaction Submission
- `aptos.transaction.submit.simple()` - Submit signed transactions
- `aptos.waitForTransaction()` - Wait for transaction confirmation
- Transaction hash tracking

## 📊 Blockchain Interaction

### View Functions
- `aptos.view()` - Call read-only Move functions
- Query contract state
- Get on-chain data without transactions

### Account Queries
- `aptos.getAccountAPTAmount()` - Get APT balance
- Account resource queries
- Account module queries

### Network Support
- **Aptos Testnet** - Default test network
- **Aptos Mainnet** - Production network (configurable)
- **Movement Testnet** - Custom network support
- Custom RPC endpoints

## 🎮 Demo Features

### Coin Flip Game (`/`)
- **Betting System**: Place bets with 0.01 APT
- **Choice Selection**: Choose 0 or 1
- **Pot System**: Winner takes all pot
- **Real-time Updates**: Auto-refresh pot balance every 5 seconds
- **Transaction Tracking**: View transaction hashes and status
- **Win/Loss Detection**: Automatic result detection
- **Explorer Links**: Direct links to Aptos Explorer

### Movement Testnet Transaction (`/movement-tx`)
- **Token Transfer**: Send MOVE tokens on Movement network
- **Recipient Input**: Enter recipient address
- **Amount Input**: Specify transfer amount
- **Balance Display**: Show current wallet balance
- **Transaction Status**: Real-time transaction status
- **Explorer Integration**: Movement network explorer links

## 🛠️ Technical Features

### Type Safety
- Full TypeScript support
- Type guards for Aptos accounts
- Proper error handling

### Error Handling
- Try-catch blocks for all async operations
- User-friendly error messages
- Console logging for debugging

### State Management
- React hooks (`useState`, `useEffect`)
- Real-time state updates
- Loading states
- Transaction status tracking

### UI/UX Features
- **Responsive Design**: Mobile-friendly layout
- **Loading States**: Visual feedback during operations
- **Status Messages**: Clear success/error messages
- **Transaction Links**: Direct links to block explorers
- **Wallet Display**: Formatted addresses and balances
- **Button States**: Disabled states during loading

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy application ID

### Privy Configuration
- Multiple login methods
- Embedded wallet creation
- Custom appearance
- MFA support
- Legal terms (optional)

## 📚 Available Hooks & Functions

### Privy Hooks
```typescript
usePrivy() // Main Privy hook
  - ready: boolean
  - authenticated: boolean
  - user: User | null
  - login: () => Promise<void>
  - logout: () => Promise<void>

useCreateWallet() // Create embedded wallets
  - createWallet: (options) => Promise<Wallet>

useSignRawHash() // Sign transaction hashes
  - signRawHash: (options) => Promise<{ signature: string }>
```

### Aptos SDK Functions
```typescript
// Transaction Building
aptos.transaction.build.simple(options)

// Transaction Submission
aptos.transaction.submit.simple(options)
aptos.waitForTransaction(options)

// View Functions
aptos.view(payload)

// Account Queries
aptos.getAccountAPTAmount(options)
```

## 🎯 Best Practices Implemented

1. **Type Safety**: Full TypeScript with proper types
2. **Error Handling**: Comprehensive try-catch blocks
3. **User Feedback**: Clear status messages
4. **Loading States**: Visual feedback during async operations
5. **Transaction Tracking**: Hash storage and explorer links
6. **Balance Updates**: Real-time balance refresh
7. **Network Support**: Multiple network configurations
8. **Security**: Proper signature handling
9. **UX**: Intuitive interface with clear actions
10. **Documentation**: Well-commented code

## 🚀 Future Enhancement Ideas

- Multi-signature support
- Batch transactions
- NFT interactions
- Token swaps
- Staking functionality
- Governance voting
- DeFi integrations
- Wallet export/import
- Transaction history
- Gas estimation display
- Network switching UI
- Custom Move module interactions

