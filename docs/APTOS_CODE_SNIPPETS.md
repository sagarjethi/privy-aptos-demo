# Aptos Code Snippets Library

**Copy-paste ready code snippets for Aptos integration**

This library provides production-ready code snippets for building on Aptos. Each snippet is fully typed, includes error handling, and is ready to use in your project.

---

## Table of Contents

1. [Authentication & Wallet Management](#1-authentication--wallet-management)
2. [Signing & Transaction Building](#2-signing--transaction-building)
3. [Transaction Submission](#3-transaction-submission)
4. [Smart Contract Interactions](#4-smart-contract-interactions)
5. [Account & Balance Queries](#5-account--balance-queries)
6. [Complete Component Examples](#6-complete-component-examples)
7. [Utility Functions](#7-utility-functions)

---

## 1. Authentication & Wallet Management

### 1.1 Privy: Login Component

```typescript
"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function LoginComponent() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (authenticated) {
    return <div>Already logged in</div>;
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Login with Privy
    </button>
  );
}
```

### 1.2 Privy: Logout Component

```typescript
"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function LogoutComponent() {
  const { logout, authenticated } = usePrivy();

  if (!authenticated) {
    return null;
  }

  return (
    <button
      onClick={logout}
      className="px-4 py-2 bg-red-500 text-white rounded"
    >
      Logout
    </button>
  );
}
```

### 1.3 Privy: Create Aptos Wallet

```typescript
"use client";

import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { useState } from "react";

export function CreateAptosWallet() {
  const { createWallet } = useCreateWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      const wallet = await createWallet({
        chainType: "aptos",
      });
      console.log("Wallet created:", wallet);
      // Wallet is automatically linked to user account
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create wallet";
      setError(errorMessage);
      console.error("Error creating wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCreateWallet}
        disabled={loading}
        className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Aptos Wallet"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
```

### 1.4 Privy: Get Aptos Wallet from User

```typescript
"use client";

import { usePrivy } from "@privy-io/react-auth";

interface AptosWallet {
  address: string;
  publicKey: string;
}

export function useAptosWallet() {
  const { user } = usePrivy();

  const getAptosWallet = (): AptosWallet | null => {
    if (!user?.linkedAccounts) return null;

    const aptosWallet = user.linkedAccounts.find(
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

// Usage in component:
export function WalletDisplay() {
  const wallet = useAptosWallet();

  if (!wallet) {
    return <div>No Aptos wallet found</div>;
  }

  return (
    <div>
      <p>Address: {wallet.address}</p>
      <p>Public Key: {wallet.publicKey}</p>
    </div>
  );
}
```

### 1.5 Generic: Wallet Connection (Petra Wallet)

```typescript
"use client";

import { useState, useEffect } from "react";

interface AptosWallet {
  address: string;
  publicKey: string;
}

declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string }>;
      account: () => Promise<{ address: string }>;
      signTransaction: (txn: any) => Promise<any>;
      disconnect: () => Promise<void>;
    };
  }
}

export function usePetraWallet() {
  const [wallet, setWallet] = useState<AptosWallet | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window === "undefined" || !window.aptos) {
      return;
    }

    try {
      const account = await window.aptos.account();
      if (account.address) {
        setWallet({
          address: account.address,
          publicKey: "", // Petra handles this internally
        });
        setConnected(true);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const connect = async () => {
    if (typeof window === "undefined" || !window.aptos) {
      alert("Please install Petra Wallet");
      return;
    }

    setLoading(true);
    try {
      const response = await window.aptos.connect();
      setWallet({
        address: response.address,
        publicKey: "",
      });
      setConnected(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (window.aptos) {
      await window.aptos.disconnect();
      setWallet(null);
      setConnected(false);
    }
  };

  return {
    wallet,
    connected,
    loading,
    connect,
    disconnect,
  };
}
```

### 1.6 Generic: Generate New Account (for testing)

```typescript
import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

/**
 * Generate a new Aptos account for testing
 * WARNING: Only use for testing! Never use in production.
 */
export function generateTestAccount(): {
  address: string;
  privateKey: string;
  publicKey: string;
} {
  const account = Account.generate();
  const privateKey = account.privateKey.toString();
  const publicKey = account.publicKey.toString();
  const address = account.accountAddress.toString();

  return {
    address,
    privateKey,
    publicKey,
  };
}

// Usage:
// const testAccount = generateTestAccount();
// console.log("Test Address:", testAccount.address);
```

---

## 2. Signing & Transaction Building

### 2.1 Privy: Sign Transaction Hash

```typescript
"use client";

import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import { usePrivy } from "@privy-io/react-auth";
import { generateSigningMessageForTransaction } from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

export function usePrivySignTransaction() {
  const { signRawHash } = useSignRawHash();
  const { user } = usePrivy();

  const signTransaction = async (rawTxn: any) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get Aptos wallet
    const aptosWallet = user.linkedAccounts?.find(
      (account) =>
        typeof account === "object" &&
        account !== null &&
        "chainType" in account &&
        (account as { chainType?: unknown }).chainType === "aptos"
    );

    if (!aptosWallet) {
      throw new Error("No Aptos wallet found");
    }

    const walletAddress = (aptosWallet as { address: string }).address;
    let publicKeyHex = (aptosWallet as { publicKey: string }).publicKey;

    // Clean public key format
    if (publicKeyHex.toLowerCase().startsWith("0x")) {
      publicKeyHex = publicKeyHex.slice(2);
    }
    if (publicKeyHex.length === 66 && publicKeyHex.startsWith("00")) {
      publicKeyHex = publicKeyHex.substring(2);
    }
    if (publicKeyHex.length !== 64) {
      throw new Error("Invalid public key format");
    }

    // Generate signing message
    const message = generateSigningMessageForTransaction(rawTxn);

    // Sign the hash
    const { signature: rawSignature } = await signRawHash({
      address: walletAddress,
      chainType: "aptos",
      hash: toHex(message),
    });

    return {
      signature: rawSignature,
      publicKey: publicKeyHex,
      address: walletAddress,
    };
  };

  return { signTransaction };
}
```

### 2.2 Generic: Sign Transaction with Private Key

```typescript
import {
  Account,
  Ed25519PrivateKey,
  generateSigningMessageForTransaction,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
} from "@aptos-labs/ts-sdk";

/**
 * Sign a transaction with a private key
 * WARNING: Never expose private keys in client-side code!
 * This is for server-side or testing only.
 */
export async function signTransactionWithPrivateKey(
  rawTxn: any,
  privateKeyHex: string
): Promise<AccountAuthenticatorEd25519> {
  // Remove 0x prefix if present
  const cleanPrivateKey = privateKeyHex.startsWith("0x")
    ? privateKeyHex.slice(2)
    : privateKeyHex;

  // Create account from private key
  const privateKey = new Ed25519PrivateKey(cleanPrivateKey);
  const account = Account.fromPrivateKey({ privateKey });

  // Generate signing message
  const message = generateSigningMessageForTransaction(rawTxn);

  // Sign the message
  const signature = account.sign(message);

  // Create authenticator
  const authenticator = new AccountAuthenticatorEd25519(
    new Ed25519PublicKey(account.publicKey.toString()),
    new Ed25519Signature(signature.toString())
  );

  return authenticator;
}
```

### 2.3 Build Simple Transaction

```typescript
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Build a simple transaction
 */
export async function buildSimpleTransaction(
  senderAddress: string,
  functionName: string,
  typeArguments: string[],
  functionArguments: any[]
) {
  try {
    const rawTxn = await aptos.transaction.build.simple({
      sender: AccountAddress.from(senderAddress),
      data: {
        function: functionName,
        typeArguments: typeArguments,
        functionArguments: functionArguments,
      },
    });

    return rawTxn;
  } catch (error) {
    console.error("Error building transaction:", error);
    throw error;
  }
}

// Usage example:
// const rawTxn = await buildSimpleTransaction(
//   "0x123...",
//   "0x1::coin::transfer",
//   ["0x1::aptos_coin::AptosCoin"],
//   [AccountAddress.from("0x456..."), BigInt(100000000)]
// );
```

### 2.4 Build APT Transfer Transaction

```typescript
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Build an APT transfer transaction
 * @param senderAddress - Sender's Aptos address
 * @param recipientAddress - Recipient's Aptos address
 * @param amountInAPT - Amount in APT (will be converted to octas)
 */
export async function buildTransferTransaction(
  senderAddress: string,
  recipientAddress: string,
  amountInAPT: number
) {
  try {
    // Convert APT to octas (1 APT = 100,000,000 octas)
    const amountInOctas = BigInt(Math.floor(amountInAPT * 100000000));

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
    console.error("Error building transfer transaction:", error);
    throw error;
  }
}
```

### 2.5 Build Smart Contract Call Transaction

```typescript
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Build a smart contract function call transaction
 */
export async function buildContractCallTransaction(
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

    return rawTxn;
  } catch (error) {
    console.error("Error building contract call:", error);
    throw error;
  }
}

// Usage example:
// const rawTxn = await buildContractCallTransaction(
//   "0x123...",
//   "0xabc...",
//   "coin_flip",
//   "play",
//   [],
//   [0, "0xabc..."]
// );
```

---

## 3. Transaction Submission

### 3.1 Privy: Complete Transaction Flow

```typescript
"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export function usePrivyTransaction() {
  const { user } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTransaction = async (
    recipientAddress: string,
    amountInAPT: number
  ) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    setLoading(true);
    setError(null);

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
        throw new Error("No Aptos wallet found");
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
            AccountAddress.from(recipientAddress),
            BigInt(Math.floor(amountInAPT * 100000000)),
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

      // Wait for confirmation
      const executed = await aptos.waitForTransaction({
        transactionHash: pending.hash,
      });

      return {
        hash: executed.hash,
        success: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Transaction failed";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendTransaction, loading, error };
}
```

### 3.2 Generic: Submit Transaction with Authenticator

```typescript
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAuthenticatorEd25519,
} from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Submit a signed transaction
 */
export async function submitTransaction(
  rawTxn: any,
  authenticator: AccountAuthenticatorEd25519
) {
  try {
    const pendingTxn = await aptos.transaction.submit.simple({
      transaction: rawTxn,
      senderAuthenticator: authenticator,
    });

    return pendingTxn;
  } catch (error) {
    console.error("Error submitting transaction:", error);
    throw error;
  }
}
```

### 3.3 Wait for Transaction Confirmation

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Wait for transaction to be confirmed
 */
export async function waitForTransaction(transactionHash: string) {
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

// Usage:
// const executed = await waitForTransaction("0x123...");
// console.log("Transaction confirmed:", executed.hash);
```

### 3.4 Complete Transaction Flow (Generic)

```typescript
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  Account,
  Ed25519PrivateKey,
  generateSigningMessageForTransaction,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
} from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Complete transaction flow: build, sign, submit, wait
 * WARNING: Only use with private keys on server-side!
 */
export async function completeTransactionFlow(
  senderPrivateKey: string,
  recipientAddress: string,
  amountInAPT: number
) {
  try {
    // Create account from private key
    const privateKey = new Ed25519PrivateKey(
      senderPrivateKey.startsWith("0x") ? senderPrivateKey.slice(2) : senderPrivateKey
    );
    const account = Account.fromPrivateKey({ privateKey });
    const senderAddress = account.accountAddress.toString();

    // Build transaction
    const rawTxn = await aptos.transaction.build.simple({
      sender: AccountAddress.from(senderAddress),
      data: {
        function: "0x1::coin::transfer",
        typeArguments: ["0x1::aptos_coin::AptosCoin"],
        functionArguments: [
          AccountAddress.from(recipientAddress),
          BigInt(Math.floor(amountInAPT * 100000000)),
        ],
      },
    });

    // Sign transaction
    const message = generateSigningMessageForTransaction(rawTxn);
    const signature = account.sign(message);

    // Create authenticator
    const authenticator = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(account.publicKey.toString()),
      new Ed25519Signature(signature.toString())
    );

    // Submit transaction
    const pending = await aptos.transaction.submit.simple({
      transaction: rawTxn,
      senderAuthenticator: authenticator,
    });

    // Wait for confirmation
    const executed = await aptos.waitForTransaction({
      transactionHash: pending.hash,
    });

    return {
      hash: executed.hash,
      success: true,
    };
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}
```

---

## 4. Smart Contract Interactions

### 4.1 Call View Function (Read-Only)

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Call a view function (read-only, no transaction needed)
 */
export async function callViewFunction(
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

// Usage example:
// const balance = await callViewFunction(
//   "0x123::my_module::get_balance",
//   [],
//   ["0x123..."]
// );
```

### 4.2 Privy: Call Contract Function (Write)

```typescript
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export function useContractCall() {
  const { user } = usePrivy();
  const { signRawHash } = useSignRawHash();

  const callContractFunction = async (
    contractAddress: string,
    moduleName: string,
    functionName: string,
    typeArguments: string[],
    functionArguments: any[]
  ) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get wallet
    const aptosWallet = user.linkedAccounts?.find(
      (account) =>
        typeof account === "object" &&
        account !== null &&
        "chainType" in account &&
        (account as { chainType?: unknown }).chainType === "aptos"
    );

    if (!aptosWallet) {
      throw new Error("No Aptos wallet found");
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
        function: `${contractAddress}::${moduleName}::${functionName}`,
        typeArguments: typeArguments,
        functionArguments: functionArguments,
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

    // Wait for confirmation
    const executed = await aptos.waitForTransaction({
      transactionHash: pending.hash,
    });

    return {
      hash: executed.hash,
      success: true,
    };
  };

  return { callContractFunction };
}
```

### 4.3 Generic: Call Contract Function

```typescript
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  Account,
  Ed25519PrivateKey,
  generateSigningMessageForTransaction,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
} from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Call a contract function (write operation)
 * WARNING: Only use with private keys on server-side!
 */
export async function callContractFunction(
  senderPrivateKey: string,
  contractAddress: string,
  moduleName: string,
  functionName: string,
  typeArguments: string[],
  functionArguments: any[]
) {
  try {
    // Create account from private key
    const privateKey = new Ed25519PrivateKey(
      senderPrivateKey.startsWith("0x") ? senderPrivateKey.slice(2) : senderPrivateKey
    );
    const account = Account.fromPrivateKey({ privateKey });
    const senderAddress = account.accountAddress.toString();

    // Build transaction
    const rawTxn = await aptos.transaction.build.simple({
      sender: AccountAddress.from(senderAddress),
      data: {
        function: `${contractAddress}::${moduleName}::${functionName}`,
        typeArguments: typeArguments,
        functionArguments: functionArguments,
      },
    });

    // Sign transaction
    const message = generateSigningMessageForTransaction(rawTxn);
    const signature = account.sign(message);

    // Create authenticator
    const authenticator = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(account.publicKey.toString()),
      new Ed25519Signature(signature.toString())
    );

    // Submit transaction
    const pending = await aptos.transaction.submit.simple({
      transaction: rawTxn,
      senderAuthenticator: authenticator,
    });

    // Wait for confirmation
    const executed = await aptos.waitForTransaction({
      transactionHash: pending.hash,
    });

    return {
      hash: executed.hash,
      success: true,
    };
  } catch (error) {
    console.error("Error calling contract function:", error);
    throw error;
  }
}
```

### 4.4 Get Contract State (View Function)

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Get contract state using view function
 */
export async function getContractState(
  contractAddress: string,
  moduleName: string,
  functionName: string,
  functionArguments: any[] = []
) {
  try {
    const result = await aptos.view({
      payload: {
        function: `${contractAddress}::${moduleName}::${functionName}`,
        typeArguments: [],
        functionArguments: functionArguments,
      },
    });

    return result;
  } catch (error) {
    console.error("Error getting contract state:", error);
    throw error;
  }
}

// Usage example:
// const potBalance = await getContractState(
//   "0x123...",
//   "coin_flip",
//   "get_pot_balance",
//   ["0x123..."]
// );
```

---

## 5. Account & Balance Queries

### 5.1 Privy: Get Account Balance

```typescript
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export function usePrivyBalance() {
  const { user } = usePrivy();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.linkedAccounts) return;

      const aptosWallet = user.linkedAccounts.find(
        (account) =>
          typeof account === "object" &&
          account !== null &&
          "chainType" in account &&
          (account as { chainType?: unknown }).chainType === "aptos"
      );

      if (!aptosWallet) {
        setBalance(0);
        return;
      }

      const address = (aptosWallet as { address: string }).address;
      setLoading(true);
      setError(null);

      try {
        const balanceOctas = await aptos.getAccountAPTAmount({
          accountAddress: AccountAddress.from(address),
        });
        // Convert octas to APT
        setBalance(Number(balanceOctas) / 100000000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch balance";
        setError(errorMessage);
        console.error("Error fetching balance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [user]);

  return { balance, loading, error };
}
```

### 5.2 Generic: Get Account Balance

```typescript
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Get account balance in APT
 */
export async function getAccountBalance(address: string): Promise<number> {
  try {
    const balanceOctas = await aptos.getAccountAPTAmount({
      accountAddress: AccountAddress.from(address),
    });

    // Convert octas to APT (1 APT = 100,000,000 octas)
    return Number(balanceOctas) / 100000000;
  } catch (error) {
    console.error("Error fetching balance:", error);
    throw error;
  }
}
```

### 5.3 Get Account Resources

```typescript
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Get all account resources
 */
export async function getAccountResources(address: string) {
  try {
    const resources = await aptos.getAccountResources({
      accountAddress: AccountAddress.from(address),
    });

    return resources;
  } catch (error) {
    console.error("Error fetching resources:", error);
    throw error;
  }
}
```

### 5.4 Get Transaction History

```typescript
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Get account transaction history
 */
export async function getTransactionHistory(
  address: string,
  limit: number = 10
) {
  try {
    const transactions = await aptos.getAccountTransactions({
      accountAddress: AccountAddress.from(address),
      options: {
        limit: limit,
      },
    });

    return transactions;
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    throw error;
  }
}
```

### 5.5 Get Transaction by Hash

```typescript
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

/**
 * Get transaction details by hash
 */
export async function getTransactionByHash(transactionHash: string) {
  try {
    const transaction = await aptos.getTransactionByHash({
      transactionHash,
    });

    return transaction;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
}
```

---

## 6. Complete Component Examples

### 6.1 Privy: Complete Transaction Component

```typescript
"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export default function TransactionComponent() {
  const { authenticated, user, login } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");

  const handleSend = async () => {
    if (!authenticated || !user) {
      setStatus("Please login first");
      return;
    }

    if (!recipient || !amount) {
      setStatus("Please fill all fields");
      return;
    }

    setLoading(true);
    setStatus("");
    setTxHash("");

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
            AccountAddress.from(recipient),
            BigInt(Math.floor(parseFloat(amount) * 100000000)),
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
      setStatus("Submitting transaction...");
      const pending = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      setTxHash(pending.hash);
      setStatus("Waiting for confirmation...");

      // Wait for confirmation
      const executed = await aptos.waitForTransaction({
        transactionHash: pending.hash,
      });

      setStatus(`Transaction confirmed! Hash: ${executed.hash}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="p-4">
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Login to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Send APT</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border rounded"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount (APT)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.00000001"
            className="w-full px-3 py-2 border rounded"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !recipient || !amount}
          className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Send Transaction"}
        </button>

        {status && (
          <div className={`p-3 rounded ${status.includes("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
            {status}
          </div>
        )}

        {txHash && (
          <div className="text-sm">
            <a
              href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              View on Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6.2 Generic: Wallet Dashboard Component

```typescript
"use client";

import { useEffect, useState } from "react";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

interface WalletInfo {
  address: string;
  balance: number;
  transactions: any[];
}

export default function WalletDashboard({ address }: { address: string }) {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get balance
        const balanceOctas = await aptos.getAccountAPTAmount({
          accountAddress: AccountAddress.from(address),
        });
        const balance = Number(balanceOctas) / 100000000;

        // Get recent transactions
        const transactions = await aptos.getAccountTransactions({
          accountAddress: AccountAddress.from(address),
          options: { limit: 5 },
        });

        setWalletInfo({
          address,
          balance,
          transactions: transactions as any[],
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch wallet info";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchWalletInfo();
      const interval = setInterval(fetchWalletInfo, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [address]);

  if (loading) {
    return <div>Loading wallet info...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!walletInfo) {
    return <div>No wallet info available</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Wallet Dashboard</h2>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p className="text-sm text-gray-600">Address</p>
        <p className="font-mono text-sm break-all">{walletInfo.address}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <p className="text-sm text-gray-600">Balance</p>
        <p className="text-2xl font-bold">{walletInfo.balance.toFixed(4)} APT</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Transactions</h3>
        <div className="space-y-2">
          {walletInfo.transactions.length === 0 ? (
            <p className="text-gray-500">No transactions found</p>
          ) : (
            walletInfo.transactions.map((tx, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded">
                <p className="font-mono text-xs break-all">
                  {tx.hash || "N/A"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

### 6.3 Privy: Contract Interaction Component

```typescript
"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSignRawHash } from "@privy-io/react-auth/extended-chains";
import {
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from "@aptos-labs/ts-sdk";
import { toHex } from "viem";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

interface ContractInteractionProps {
  contractAddress: string;
  moduleName: string;
  functionName: string;
  typeArguments?: string[];
  functionArguments?: any[];
  viewFunction?: boolean; // If true, calls view function instead
}

export default function ContractInteractionComponent({
  contractAddress,
  moduleName,
  functionName,
  typeArguments = [],
  functionArguments = [],
  viewFunction = false,
}: ContractInteractionProps) {
  const { authenticated, user, login } = usePrivy();
  const { signRawHash } = useSignRawHash();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");

  const handleCall = async () => {
    if (!authenticated || !user) {
      setError("Please login first");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setTxHash("");

    try {
      if (viewFunction) {
        // Call view function (read-only)
        const viewResult = await aptos.view({
          payload: {
            function: `${contractAddress}::${moduleName}::${functionName}`,
            typeArguments: typeArguments,
            functionArguments: functionArguments,
          },
        });
        setResult(viewResult);
      } else {
        // Call contract function (write)
        const aptosWallet = user.linkedAccounts?.find(
          (account) =>
            typeof account === "object" &&
            account !== null &&
            "chainType" in account &&
            (account as { chainType?: unknown }).chainType === "aptos"
        );

        if (!aptosWallet) {
          throw new Error("No Aptos wallet found");
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
            function: `${contractAddress}::${moduleName}::${functionName}`,
            typeArguments: typeArguments,
            functionArguments: functionArguments,
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

        setTxHash(pending.hash);

        // Wait for confirmation
        const executed = await aptos.waitForTransaction({
          transactionHash: pending.hash,
        });

        setResult({
          hash: executed.hash,
          success: true,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Contract call failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="p-4">
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Login to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Contract Interaction</h2>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p className="text-sm text-gray-600">Contract</p>
        <p className="font-mono text-xs break-all">{contractAddress}</p>
        <p className="text-sm text-gray-600 mt-2">Function</p>
        <p className="font-mono text-sm">{moduleName}::{functionName}</p>
      </div>

      <button
        onClick={handleCall}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? "Processing..." : viewFunction ? "Call View Function" : "Call Function"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {txHash && (
        <div className="mt-4 text-sm">
          <a
            href={`https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            View Transaction on Explorer
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Utility Functions

### 7.1 Address Formatting

```typescript
/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string, length: number = 6): string {
  if (!address) return "";
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

// Usage:
// formatAddress("0x1234567890abcdef1234567890abcdef12345678") 
// => "0x1234...5678"
```

### 7.2 Address Validation

```typescript
import { AccountAddress } from "@aptos-labs/ts-sdk";

/**
 * Validate Aptos address format
 */
export function isValidAddress(address: string): boolean {
  try {
    AccountAddress.from(address);
    return true;
  } catch {
    return false;
  }
}
```

### 7.3 Convert Octas to APT

```typescript
/**
 * Convert octas to APT
 * 1 APT = 100,000,000 octas
 */
export function octasToAPT(octas: string | number | bigint): number {
  const octasNumber =
    typeof octas === "bigint"
      ? Number(octas)
      : typeof octas === "string"
      ? parseInt(octas)
      : octas;
  return octasNumber / 100000000;
}

// Usage:
// octasToAPT("100000000") => 1
// octasToAPT(100000000) => 1
// octasToAPT(BigInt(100000000)) => 1
```

### 7.4 Convert APT to Octas

```typescript
/**
 * Convert APT to octas
 * 1 APT = 100,000,000 octas
 */
export function aptToOctas(apt: number): bigint {
  return BigInt(Math.floor(apt * 100000000));
}

// Usage:
// aptToOctas(1) => 100000000n
// aptToOctas(0.5) => 50000000n
```

### 7.5 Format APT Amount

```typescript
/**
 * Format APT amount with proper decimal places
 */
export function formatAPT(amount: number, decimals: number = 4): string {
  return amount.toFixed(decimals);
}

// Usage:
// formatAPT(1.23456789) => "1.2346"
// formatAPT(1.23456789, 8) => "1.23456789"
```

### 7.6 Type Guard for Aptos Account

```typescript
interface AptosLinkedAccount {
  chainType: string;
  address: string;
  publicKey: string;
}

/**
 * Type guard to check if account is Aptos account
 */
export function isAptosAccount(account: unknown): account is AptosLinkedAccount {
  return (
    typeof account === "object" &&
    account !== null &&
    "chainType" in account &&
    (account as { chainType?: unknown }).chainType === "aptos" &&
    "address" in account &&
    typeof (account as { address: unknown }).address === "string" &&
    "publicKey" in account &&
    typeof (account as { publicKey: unknown }).publicKey === "string"
  );
}
```

### 7.7 Clean Public Key Format

```typescript
/**
 * Clean and normalize public key format
 */
export function cleanPublicKey(publicKeyHex: string): string {
  let cleaned = publicKeyHex;

  // Remove 0x prefix
  if (cleaned.toLowerCase().startsWith("0x")) {
    cleaned = cleaned.slice(2);
  }

  // Remove leading 00 if present (some formats include this)
  if (cleaned.length === 66 && cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // Validate length (should be 64 hex chars = 32 bytes)
  if (cleaned.length !== 64) {
    throw new Error(`Invalid public key length: ${cleaned.length}, expected 64`);
  }

  return cleaned;
}
```

### 7.8 Error Handler

```typescript
/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred";
}

// Usage:
// try {
//   await someFunction();
// } catch (error) {
//   const message = getErrorMessage(error);
//   console.error(message);
// }
```

### 7.9 Transaction Status Helper

```typescript
/**
 * Get human-readable transaction status
 */
export function getTransactionStatus(transaction: any): string {
  if (!transaction) return "Unknown";

  if (transaction.success !== undefined) {
    return transaction.success ? "Success" : "Failed";
  }

  if (transaction.type === "pending_transaction") {
    return "Pending";
  }

  if (transaction.type === "user_transaction") {
    return transaction.success ? "Success" : "Failed";
  }

  return "Unknown";
}
```

### 7.10 Explorer Link Generator

```typescript
/**
 * Generate Aptos Explorer link for transaction
 */
export function getExplorerLink(
  transactionHash: string,
  network: "testnet" | "mainnet" = "testnet"
): string {
  const baseUrl =
    network === "mainnet"
      ? "https://explorer.aptoslabs.com"
      : "https://explorer.aptoslabs.com";
  return `${baseUrl}/txn/${transactionHash}?network=${network}`;
}

// Usage:
// const link = getExplorerLink("0x123...", "testnet");
// => "https://explorer.aptoslabs.com/txn/0x123...?network=testnet"
```

---

## Quick Reference

### Common Patterns

**1. Privy Transaction Flow:**
```typescript
// 1. Get wallet from user
const wallet = getAptosWallet();

// 2. Build transaction
const rawTxn = await buildTransaction(...);

// 3. Sign with Privy
const { signature, publicKey } = await signTransaction(rawTxn);

// 4. Submit and wait
const result = await submitAndWait(rawTxn, signature, publicKey);
```

**2. Generic Transaction Flow:**
```typescript
// 1. Build transaction
const rawTxn = await buildTransaction(...);

// 2. Sign with private key (server-side only!)
const authenticator = await signWithPrivateKey(rawTxn, privateKey);

// 3. Submit and wait
const result = await submitAndWait(rawTxn, authenticator);
```

**3. View Function Call:**
```typescript
// No signing needed - read-only
const result = await callViewFunction(
  "0x123::module::function",
  [],
  []
);
```

---

## Notes

- **Security**: Never expose private keys in client-side code
- **Network**: Always test on testnet before mainnet
- **Error Handling**: Always wrap async operations in try-catch
- **Type Safety**: Use TypeScript types for better development experience
- **Testing**: Test all functions with small amounts first

---

**Last Updated**: 2025

