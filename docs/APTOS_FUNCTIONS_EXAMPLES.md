# Aptos Functions & Examples - Complete Reference Guide

This guide provides comprehensive examples of all Aptos functions you'll need for building on Aptos. Use this as a template for your new Aptos projects.

## 📦 Installation & Setup

```bash
# Install required packages
pnpm add @aptos-labs/ts-sdk @privy-io/react-auth @privy-io/react-auth/extended-chains viem
```

## 🔧 Basic Setup

### 1. Aptos Client Configuration

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Testnet Configuration
const aptosTestnet = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
  })
);

// Mainnet Configuration
const aptosMainnet = new Aptos(
  new AptosConfig({
    network: Network.MAINNET,
  })
);

// Custom Network Configuration
const aptosCustom = new Aptos(
  new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://your-custom-rpc-url.com/v1",
  })
);
```

### 2. Privy Provider Setup

```typescript
"use client";
import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "sms", "wallet", "google", "twitter"],
        embeddedWallets: {},
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

## 🔐 Authentication & Wallet Functions

### 3. User Authentication

```typescript
import { usePrivy } from "@privy-io/react-auth";

function MyComponent() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Check if user is authenticated
  if (!ready) return <div>Loading...</div>;
  if (!authenticated) return <button onClick={login}>Login</button>;

  return (
    <div>
      <p>Welcome, {user?.id}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 4. Create Aptos Wallet

```typescript
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";

function CreateWalletComponent() {
  const { createWallet } = useCreateWallet();

  const handleCreateWallet = async () => {
    try {
      const wallet = await createWallet({
        chainType: "aptos",
      });
      console.log("Wallet created:", wallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
    }
  };

  return <button onClick={handleCreateWallet}>Create Aptos Wallet</button>;
}
```

### 5. Get Aptos Wallet from User

```typescript
function GetAptosWallet() {
  const { user } = usePrivy();

  const getAptosWallet = () => {
    const aptosWallet = user?.linkedAccounts?.find(
      (account) => 
        typeof account === "object" &&
        account !== null &&
        "chainType" in account &&
        (account as { chainType?: unknown }).chainType === "aptos"
    );

    if (aptosWallet) {
      const address = (aptosWallet as { address: string }).address;
      const publicKey = (aptosWallet as { publicKey: string }).publicKey;
      return { address, publicKey };
    }
    return null;
  };

  const wallet = getAptosWallet();
  return <div>Address: {wallet?.address}</div>;
}
```

## 💰 Account & Balance Functions

### 6. Get Account Balance

```typescript
import { AccountAddress } from "@aptos-labs/ts-sdk";

async function getBalance(address: string) {
  try {
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: AccountAddress.from(address),
    });
    
    // Convert from octas to APT (1 APT = 100,000,000 octas)
    const aptBalance = Number(balance) / 100000000;
    return aptBalance;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}

// Usage
const balance = await getBalance("0x123...");
console.log(`Balance: ${balance} APT`);
```

### 7. Get Account Resources

```typescript
async function getAccountResources(address: string) {
  try {
    const resources = await aptos.getAccountResources({
      accountAddress: AccountAddress.from(address),
    });
    return resources;
  } catch (error) {
    console.error("Error fetching resources:", error);
    return [];
  }
}
```

### 8. Get Account Modules

```typescript
async function getAccountModules(address: string) {
  try {
    const modules = await aptos.getAccountModules({
      accountAddress: AccountAddress.from(address),
    });
    return modules;
  } catch (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
}
```

## 📝 Transaction Functions

### 9. Build Simple Transaction

```typescript
import { AccountAddress } from "@aptos-labs/ts-sdk";

async function buildTransaction(
  senderAddress: string,
  functionName: string,
  typeArguments: string[],
  functionArguments: any[]
) {
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: AccountAddress.from(senderAddress),
      data: {
        function: functionName, // e.g., "0x1::coin::transfer"
        typeArguments: typeArguments, // e.g., ["0x1::aptos_coin::AptosCoin"]
        functionArguments: functionArguments, // e.g., [recipient, amount]
      },
    });
    return transaction;
  } catch (error) {
    console.error("Error building transaction:", error);
    throw error;
  }
}
```

### 10. Transfer APT (Coin Transfer)

```typescript
async function transferAPT(
  senderAddress: string,
  recipientAddress: string,
  amountInAPT: number
) {
  try {
    // Convert APT to octas
    const amountInOctas = BigInt(amountInAPT * 100000000);

    const rawTxn = await aptos.transaction.build.simple({
      sender: AccountAddress.from(senderAddress),
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [
          AccountAddress.from(recipientAddress),
          amountInOctas,
        ],
      },
    });

    return rawTxn;
  } catch (error) {
    console.error("Error building transfer:", error);
    throw error;
  }
}
```

### 11. Sign Transaction

```typescript
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { generateSigningMessageForTransaction } from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

function SignTransactionComponent() {
  const { signRawHash } = useSignRawHash();
  const { user } = usePrivy();

  const signTransaction = async (rawTxn: any) => {
    try {
      // Get wallet address
      const aptosWallet = user?.linkedAccounts?.find(
        (account) => 
          typeof account === "object" &&
          account !== null &&
          "chainType" in account &&
          (account as { chainType?: unknown }).chainType === "aptos"
      );

      if (!aptosWallet) throw new Error("No Aptos wallet found");

      const walletAddress = (aptosWallet as { address: string }).address;
      const publicKeyHex = (aptosWallet as { publicKey: string }).publicKey;

      // Generate signing message
      const message = generateSigningMessageForTransaction(rawTxn);

      // Sign the hash
      const { signature: rawSignature } = await signRawHash({
        address: walletAddress,
        chainType: "aptos",
        hash: toHex(message),
      });

      // Clean up public key format
      let cleanPublicKey = publicKeyHex;
      if (cleanPublicKey.toLowerCase().startsWith("0x")) {
        cleanPublicKey = cleanPublicKey.slice(2);
      }
      if (cleanPublicKey.length === 66 && cleanPublicKey.startsWith("00")) {
        cleanPublicKey = cleanPublicKey.substring(2);
      }

      return {
        signature: rawSignature,
        publicKey: cleanPublicKey,
      };
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  };

  return { signTransaction };
}
```

### 12. Submit Transaction

```typescript
import {
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
} from "@aptos-labs/ts-sdk";

async function submitTransaction(
  rawTxn: any,
  signature: string,
  publicKey: string
) {
  try {
    // Create authenticator
    const senderAuthenticator = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(publicKey),
      new Ed25519Signature(signature.slice(2)) // Remove 0x prefix
    );

    // Submit transaction
    const pendingTxn = await aptos.transaction.submit.simple({
      transaction: rawTxn,
      senderAuthenticator,
    });

    return pendingTxn;
  } catch (error) {
    console.error("Error submitting transaction:", error);
    throw error;
  }
}
```

### 13. Wait for Transaction

```typescript
async function waitForTransaction(transactionHash: string) {
  try {
    const executedTxn = await aptos.waitForTransaction({
      transactionHash,
    });
    return executedTxn;
  } catch (error) {
    console.error("Error waiting for transaction:", error);
    throw error;
  }
}
```

### 14. Complete Transaction Flow

```typescript
async function completeTransactionFlow(
  senderAddress: string,
  recipientAddress: string,
  amountInAPT: number
) {
  try {
    // 1. Build transaction
    const rawTxn = await transferAPT(senderAddress, recipientAddress, amountInAPT);

    // 2. Sign transaction (using Privy)
    const { signature, publicKey } = await signTransaction(rawTxn);

    // 3. Submit transaction
    const pendingTxn = await submitTransaction(rawTxn, signature, publicKey);
    console.log("Transaction submitted:", pendingTxn.hash);

    // 4. Wait for confirmation
    const executedTxn = await waitForTransaction(pendingTxn.hash);
    console.log("Transaction confirmed:", executedTxn.hash);

    return executedTxn;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}
```

## 📖 View Functions (Read-Only)

### 15. Call View Function

```typescript
async function callViewFunction(
  functionName: string,
  typeArguments: string[],
  functionArguments: any[]
) {
  try {
    const result = await aptos.view({
      payload: {
        function: functionName,
        typeArguments: typeArguments,
        functionArguments: functionArguments,
      },
    });
    return result;
  } catch (error) {
    console.error("Error calling view function:", error);
    throw error;
  }
}

// Example: Get contract state
const result = await callViewFunction(
  "0x123::my_module::get_value",
  [],
  []
);
```

### 16. Get Contract Balance

```typescript
async function getContractBalance(contractAddress: string) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${contractAddress}::my_module::get_balance`,
        typeArguments: [],
        functionArguments: [contractAddress],
      },
    });
    return result[0] as string;
  } catch (error) {
    console.error("Error getting contract balance:", error);
    throw error;
  }
}
```

## 🎮 Smart Contract Interaction Examples

### 17. Call Smart Contract Function

```typescript
async function callContractFunction(
  senderAddress: string,
  contractAddress: string,
  moduleName: string,
  functionName: string,
  typeArguments: string[],
  functionArguments: any[]
) {
  try {
    const rawTxn = await aptos.transaction.build.simple({
      sender: AccountAddress.from(senderAddress),
      data: {
        function: `${contractAddress}::${moduleName}::${functionName}`,
        typeArguments: typeArguments,
        functionArguments: functionArguments,
      },
    });

    // Sign and submit (use functions from above)
    return rawTxn;
  } catch (error) {
    console.error("Error calling contract function:", error);
    throw error;
  }
}
```

### 18. Coin Flip Example

```typescript
async function playCoinFlip(
  senderAddress: string,
  choice: number,
  contractAddress: string
) {
  try {
    const rawTxn = await aptos.transaction.build.simple({
      sender: AccountAddress.from(senderAddress),
      data: {
        function: `${contractAddress}::coin_flip::play`,
        typeArguments: [],
        functionArguments: [choice, contractAddress],
      },
    });

    return rawTxn;
  } catch (error) {
    console.error("Error playing coin flip:", error);
    throw error;
  }
}
```

### 19. Get Coin Flip Pot Balance

```typescript
async function getPotBalance(contractAddress: string) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${contractAddress}::coin_flip::get_pot_balance`,
        typeArguments: [],
        functionArguments: [contractAddress],
      },
    });
    return result[0] as string;
  } catch (error) {
    console.error("Error getting pot balance:", error);
    throw error;
  }
}
```

## 🔍 Query Functions

### 20. Get Transaction by Hash

```typescript
async function getTransaction(hash: string) {
  try {
    const transaction = await aptos.getTransactionByHash({
      transactionHash: hash,
    });
    return transaction;
  } catch (error) {
    console.error("Error getting transaction:", error);
    throw error;
  }
}
```

### 21. Get Account Transactions

```typescript
async function getAccountTransactions(address: string, limit: number = 10) {
  try {
    const transactions = await aptos.getAccountTransactions({
      accountAddress: AccountAddress.from(address),
      options: {
        limit: limit,
      },
    });
    return transactions;
  } catch (error) {
    console.error("Error getting account transactions:", error);
    throw error;
  }
}
```

### 22. Get Ledger Info

```typescript
async function getLedgerInfo() {
  try {
    const ledgerInfo = await aptos.getLedgerInfo();
    return ledgerInfo;
  } catch (error) {
    console.error("Error getting ledger info:", error);
    throw error;
  }
}
```

## 🛠️ Utility Functions

### 23. Convert Octas to APT

```typescript
function octasToAPT(octas: string | number | bigint): number {
  const octasNumber = typeof octas === "bigint" 
    ? Number(octas) 
    : typeof octas === "string" 
    ? parseInt(octas) 
    : octas;
  return octasNumber / 100000000;
}
```

### 24. Convert APT to Octas

```typescript
function aptToOctas(apt: number): bigint {
  return BigInt(Math.floor(apt * 100000000));
}
```

### 25. Format Address

```typescript
function formatAddress(address: string, length: number = 6): string {
  if (!address) return "";
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}
```

### 26. Validate Address

```typescript
import { AccountAddress } from "@aptos-labs/ts-sdk";

function isValidAddress(address: string): boolean {
  try {
    AccountAddress.from(address);
    return true;
  } catch {
    return false;
  }
}
```

## 🎯 React Hook Examples

### 27. Custom Hook: Use Aptos Wallet

```typescript
import { usePrivy } from "@privy-io/react-auth";

function useAptosWallet() {
  const { user } = usePrivy();

  const getAptosWallet = () => {
    const aptosWallet = user?.linkedAccounts?.find(
      (account) => 
        typeof account === "object" &&
        account !== null &&
        "chainType" in account &&
        (account as { chainType?: unknown }).chainType === "aptos"
    );

    if (aptosWallet) {
      return {
        address: (aptosWallet as { address: string }).address,
        publicKey: (aptosWallet as { publicKey: string }).publicKey,
      };
    }
    return null;
  };

  return getAptosWallet();
}
```

### 28. Custom Hook: Use Balance

```typescript
import { useState, useEffect } from "react";
import { useAptosWallet } from "./useAptosWallet";

function useBalance() {
  const wallet = useAptosWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wallet?.address) return;

    const fetchBalance = async () => {
      setLoading(true);
      try {
        const balanceOctas = await aptos.getAccountAPTAmount({
          accountAddress: AccountAddress.from(wallet.address),
        });
        setBalance(octasToAPT(balanceOctas.toString()));
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [wallet?.address]);

  return { balance, loading };
}
```

## 📋 Complete Example Component

### 29. Full Transaction Component

```typescript
"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useCreateWallet, useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { AccountAddress, generateSigningMessageForTransaction } from "@aptos-labs/ts-sdk";
import { AccountAuthenticatorEd25519, Ed25519PublicKey, Ed25519Signature } from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

export default function TransactionComponent() {
  const { authenticated, user, login } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleTransaction = async () => {
    if (!authenticated || !user) {
      setStatus("Please login first");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      // Get wallet
      const aptosWallet = user.linkedAccounts?.find(
        (account) => 
          typeof account === "object" &&
          account !== null &&
          "chainType" in account &&
          (account as { chainType?: unknown }).chainType === "aptos"
      );

      if (!aptosWallet) {
        setStatus("Please create an Aptos wallet first");
        setLoading(false);
        return;
      }

      const walletAddress = (aptosWallet as { address: string }).address;
      let publicKeyHex = (aptosWallet as { publicKey: string }).publicKey;

      // Clean public key
      if (publicKeyHex.toLowerCase().startsWith("0x")) {
        publicKeyHex = publicKeyHex.slice(2);
      }
      if (publicKeyHex.length === 66 && publicKeyHex.startsWith("00")) {
        publicKeyHex = publicKeyHex.substring(2);
      }

      // Build transaction
      const rawTxn = await aptos.transaction.build.simple({
        sender: AccountAddress.from(walletAddress),
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [
            AccountAddress.from("0x123..."), // recipient
            BigInt(100000000), // 1 APT in octas
          ],
        },
      });

      // Sign transaction
      const message = generateSigningMessageForTransaction(rawTxn);
      const { signature: rawSignature } = await signRawHash({
        address: walletAddress,
        chainType: "aptos",
        hash: toHex(message),
      });

      // Create authenticator
      const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(publicKeyHex),
        new Ed25519Signature(rawSignature.slice(2))
      );

      // Submit transaction
      const pending = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      setStatus(`Transaction submitted: ${pending.hash}`);

      // Wait for confirmation
      const executed = await aptos.waitForTransaction({
        transactionHash: pending.hash,
      });

      setStatus(`Transaction confirmed: ${executed.hash}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return <button onClick={login}>Login</button>;
  }

  return (
    <div>
      <button onClick={handleTransaction} disabled={loading}>
        {loading ? "Processing..." : "Send Transaction"}
      </button>
      {status && <p>{status}</p>}
    </div>
  );
}
```

## 🚀 Quick Start Template

Copy this template to start your new Aptos project:

```typescript
// 1. Setup Aptos client
const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

// 2. Get wallet
const wallet = getAptosWallet();

// 3. Build transaction
const rawTxn = await aptos.transaction.build.simple({...});

// 4. Sign transaction
const { signature, publicKey } = await signTransaction(rawTxn);

// 5. Submit transaction
const pending = await submitTransaction(rawTxn, signature, publicKey);

// 6. Wait for confirmation
const executed = await waitForTransaction(pending.hash);
```

## 📚 Additional Resources

- [Aptos TypeScript SDK Docs](https://aptos-labs.github.io/ts-sdk/)
- [Privy Documentation](https://docs.privy.io/)
- [Aptos Developer Docs](https://aptos.dev/)
- [Aptos Explorer](https://explorer.aptoslabs.com/)

---

**Note**: Always handle errors properly, validate inputs, and test on testnet before mainnet!

