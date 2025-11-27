"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useCreateWallet,
  useSignRawHash,
} from "@privy-io/react-auth/extended-chains";
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
import {
  formatAPT,
  cleanPublicKey,
  getErrorMessage,
  getMovementExplorerLink,
  aptToOctas,
  isValidAddress,
  octasToAPT,
} from "@/lib/aptos-utils";
import { useAptosWallet } from "@/lib/aptos-hooks";

interface AptosLinkedAccount {
  chainType: string;
  address: string;
  publicKey: string;
}

function isAptosAccount(account: unknown): account is AptosLinkedAccount {
  return (
    typeof account === "object" &&
    account !== null &&
    "chainType" in account &&
    (account as { chainType: unknown }).chainType === "aptos" &&
    "address" in account &&
    typeof (account as { address: unknown }).address === "string" &&
    "publicKey" in account &&
    typeof (account as { publicKey: unknown }).publicKey === "string"
  );
}

// Configure Move client for Movement testnet
const aptos = new Aptos(
  new AptosConfig({
    network: Network.CUSTOM,
    fullnode: "https://testnet.movementnetwork.xyz/v1",
  })
);

export default function MovementTxPage() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();
  const moveWallet = useAptosWallet();

  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<string>("0");
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [addressError, setAddressError] = useState<string>("");

  const createMoveWallet = async () => {
    setCreatingWallet(true);
    try {
      const wallet = await createWallet({
        chainType: "aptos",
      });
      return wallet;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setTxStatus(`Error creating wallet: ${errorMessage}`);
    } finally {
      setCreatingWallet(false);
    }
  };

  const fetchWalletBalance = async (address: string) => {
    try {
      const result = await aptos.getAccountAPTAmount({
        accountAddress: address,
      });
      setWalletBalance(result.toString());
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalance("0");
    }
  };

  useEffect(() => {
    if (moveWallet?.address) {
      fetchWalletBalance(moveWallet.address);
    }
  }, [moveWallet?.address]);

  const handleTransaction = async () => {
    if (!authenticated || !user) {
      setTxStatus("Please connect your wallet first");
      return;
    }

    if (!moveWallet) {
      setTxStatus("Please create a Move wallet first");
      return;
    }

    if (!recipientAddress.trim()) {
      setTxStatus("Please enter a recipient address");
      setAddressError("Recipient address is required");
      return;
    }

    // Validate address format
    if (!isValidAddress(recipientAddress.trim())) {
      setTxStatus("Invalid recipient address format");
      setAddressError("Please enter a valid Aptos address");
      return;
    }

    setAddressError("");

    const walletAddress = moveWallet.address;
    let publicKeyHex = moveWallet.publicKey;

    if (!walletAddress || !publicKeyHex) {
      setTxStatus("Wallet not properly configured");
      return;
    }

    setIsLoading(true);
    setTxStatus("");

    try {
      // Clean public key using utility function
      try {
        publicKeyHex = cleanPublicKey(publicKeyHex);
      } catch {
        setTxStatus("Invalid public key format");
        setIsLoading(false);
        return;
      }

      const address = AccountAddress.from(walletAddress);
      const recipientAddr = AccountAddress.from(recipientAddress.trim());
      const amountInOctas = aptToOctas(parseFloat(amount) || 0);

      // Build the raw transaction
      const rawTxn = await aptos.transaction.build.simple({
        sender: address,
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [recipientAddr, amountInOctas],
        },
      });

      const message = generateSigningMessageForTransaction(rawTxn);

      // Sign the transaction using raw signing
      const { signature: rawSignature } = await signRawHash({
        address: walletAddress,
        chainType: "aptos",
        hash: toHex(message),
      });

      // Create authenticator and submit transaction
      const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(publicKeyHex),
        new Ed25519Signature(rawSignature.slice(2))
      );

      const pending = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      setTxHash(pending.hash);
      setTxStatus("Transaction submitted! Waiting for confirmation...");

      const executed = await aptos.waitForTransaction({
        transactionHash: pending.hash,
      });

      setTxStatus(`✅ Transaction successful! Hash: ${executed.hash}`);

      // Refresh wallet balance
      await fetchWalletBalance(walletAddress);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setTxStatus(`❌ Error: ${errorMessage}`);
      console.error("Transaction error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600 p-8">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center max-w-md w-full">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Movement Testnet Transaction
          </h2>
          <p className="text-gray-600 mb-6">
            Send MOVE tokens on Movement testnet using raw signing
          </p>
          <button
            onClick={login}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Login with Privy
          </button>
        </div>
      </div>
    );
  }

  const balanceInMOVE = formatAPT(octasToAPT(walletBalance));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 max-w-lg w-full">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Movement Testnet TX
          </h2>
          <p className="text-gray-600">Send MOVE tokens using raw signing</p>
        </div>

        {/* Move Wallet Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2 text-center">
            Move Wallet
          </div>
          {moveWallet ? (
            <div className="text-center">
              <div className="text-sm text-blue-600 mb-1">Address:</div>
              <div className="text-xs font-mono text-blue-800 break-all bg-blue-100 p-2 rounded mb-2">
                {moveWallet.address}
              </div>
              <div className="text-sm text-blue-600">
                Balance:{" "}
                <span className="font-semibold">{balanceInMOVE} MOVE</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm text-blue-600 mb-3">
                No Move wallet found
              </div>
              <button
                onClick={createMoveWallet}
                disabled={creatingWallet}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingWallet ? "Creating..." : "Create Move Wallet"}
              </button>
            </div>
          )}
        </div>

        {/* Transaction Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value);
                setAddressError("");
              }}
              placeholder="0x..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                addressError ? "border-red-300" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {addressError && (
              <p className="text-xs text-red-500 mt-1">{addressError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (APT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1"
              min="0.00000001"
              step="0.00000001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          onClick={handleTransaction}
          disabled={isLoading || !moveWallet || !recipientAddress.trim()}
          className={`w-full px-6 py-3 text-lg font-semibold rounded-lg transition-all duration-200 mb-4 ${
            isLoading || !moveWallet || !recipientAddress.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
          }`}
        >
          {isLoading ? "Sending Transaction..." : "Send Transaction"}
        </button>

        {txStatus && (
          <div className="p-4 rounded-lg text-sm text-center mb-4 bg-gray-50 border border-gray-200">
            <div className="mb-2">{txStatus}</div>
            {txHash && (
              <div className="text-xs mt-2">
                <a
                  href={getMovementExplorerLink(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  View on Move Explorer ↗
                </a>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
          <p className="my-1 leading-relaxed">
            💡 <strong>Movement Testnet:</strong>
          </p>
          <p className="my-1 leading-relaxed">
            • Uses raw signing with Privy
            <br />• Sends MOVE tokens via coin::transfer
            <br />• Fullnode: movementnetwork.xyz
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
