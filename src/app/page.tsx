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
  getExplorerLink,
  octasToAPT,
} from "@/lib/aptos-utils";
import { useAptosWallet, useAptosBalance } from "@/lib/aptos-hooks";

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

const CONTRACT_ADDRESS =
  "0x10bcbbc693740204b97bff6a76c344a9aed7f8c1bbd2b2482b9a0fd947b2b55e";
const BET_AMOUNT = 1000000;

const aptos = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
  })
);

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();
  const aptosWallet = useAptosWallet();
  const { balance: walletBalance } = useAptosBalance();

  const [choice, setChoice] = useState<number>(0);
  const [potBalance, setPotBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<string>("");
  const [lastResult, setLastResult] = useState<"win" | "lose" | null>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [creatingWallet, setCreatingWallet] = useState(false);

  const createAptosWallet = async () => {
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
  const fetchPotBalance = async () => {
    try {
      const result = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::coin_flip::get_pot_balance`,
          typeArguments: [],
          functionArguments: [CONTRACT_ADDRESS],
        },
      });
      setPotBalance(result[0] as string);
    } catch (error) {
      console.error("Error fetching pot balance:", error);
    }
  };

  useEffect(() => {
    if (authenticated) {
      fetchPotBalance();
      const interval = setInterval(fetchPotBalance, 5000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const handlePlay = async () => {
    if (!authenticated || !user) {
      setTxStatus("Please connect your wallet first");
      return;
    }

    const foundAccount = user.linkedAccounts?.find(
      (account) => 
        typeof account === "object" &&
        account !== null &&
        "chainType" in account &&
        (account as { chainType?: unknown }).chainType === "aptos"
    );
    const aptosWallet = foundAccount && isAptosAccount(foundAccount) ? foundAccount : undefined;

    if (!aptosWallet) {
      setTxStatus("Please create an Aptos wallet first");
      return;
    }

    const walletAddress = aptosWallet.address;
    let publicKeyHex = aptosWallet.publicKey;

    if (!walletAddress || !publicKeyHex) {
      setTxStatus("Wallet not properly configured");
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const potBefore = potBalance;

      // Clean public key using utility function
      try {
        publicKeyHex = cleanPublicKey(publicKeyHex);
      } catch {
        setTxStatus("Invalid public key format");
        setIsLoading(false);
        return;
      }

      const address = AccountAddress.from(walletAddress);

      const rawTxn = await aptos.transaction.build.simple({
        sender: address,
        data: {
          function: `${CONTRACT_ADDRESS}::coin_flip::play`,
          typeArguments: [],
          functionArguments: [choice, CONTRACT_ADDRESS],
        },
      });

      const message = generateSigningMessageForTransaction(rawTxn);

      const { signature: rawSignature } = await signRawHash({
        address: walletAddress,
        chainType: "aptos",
        hash: toHex(message),
      });

      const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(publicKeyHex),
        new Ed25519Signature(rawSignature.slice(2))
      );

      const pending = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator,
      });

      await aptos.waitForTransaction({
        transactionHash: pending.hash,
      });

      setTxHash(pending.hash);

      await fetchPotBalance();

      const potAfter = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::coin_flip::get_pot_balance`,
          typeArguments: [],
          functionArguments: [CONTRACT_ADDRESS],
        },
      });
      const potAfterValue = potAfter[0] as string;

      if (parseInt(potAfterValue) === 0 && parseInt(potBefore) > 0) {
        setLastResult("win");
        setTxStatus(
          `🎉 YOU WON! You took ${
            (parseInt(potBefore) + BET_AMOUNT) / 100000000
          } APT!`
        );
      } else if (parseInt(potAfterValue) > parseInt(potBefore)) {
        setLastResult("lose");
        setTxStatus(`😢 You lost. Your 0.01 APT is now in the pot.`);
      } else {
        setLastResult("win");
        setTxStatus(`🎉 YOU WON THE JACKPOT!`);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setTxStatus(`Error: ${errorMessage}`);
      setLastResult(null);
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
            Privy x Aptos demo
          </h2>
          <button
            onClick={login}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const aptBalance = formatAPT(octasToAPT(potBalance));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Privy x Aptos demo
        </h2>
        <p className="text-[0.95rem] text-gray-600 mb-6 text-center">
          Choose 0 or 1, bet 0.01 APT. Winner takes all!
        </p>

        {/* Aptos Wallet Section */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2 text-center">
            Aptos Wallet
          </div>
          {aptosWallet ? (
            <div className="text-center">
              <div className="text-sm text-blue-600 mb-1">Address:</div>
              <div className="text-xs font-mono text-blue-800 break-all bg-blue-100 p-2 rounded mb-2">
                {aptosWallet.address}
              </div>
              <div className="text-sm text-blue-600">
                Balance: <span className="font-semibold">{formatAPT(walletBalance)} APT</span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-sm text-blue-600 mb-3">
                No Aptos wallet found
              </div>
              <button
                onClick={createAptosWallet}
                disabled={creatingWallet}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingWallet ? "Creating..." : "Create Aptos Wallet"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 mb-6 text-center">
          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Current Jackpot
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {aptBalance} APT
          </div>
          <div className="text-sm text-gray-500">{potBalance} Octas</div>
        </div>

        <div className="mb-6">
          <div className="text-[0.95rem] font-medium text-gray-700 mb-3 text-center">
            Choose your side:
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setChoice(0)}
              disabled={isLoading}
              className={`flex-1 max-w-[100px] p-4 text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                choice === 0
                  ? "bg-gray-900 text-white border-gray-900 scale-105"
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              } ${
                isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              0
            </button>
            <button
              onClick={() => setChoice(1)}
              disabled={isLoading}
              className={`flex-1 max-w-[100px] p-4 text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                choice === 1
                  ? "bg-gray-900 text-white border-gray-900 scale-105"
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              } ${
                isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              1
            </button>
          </div>
        </div>

        <button
          onClick={handlePlay}
          disabled={isLoading}
          className={`w-full px-8 py-4 text-lg font-semibold bg-gray-900 text-white rounded-xl transition-all duration-200 mb-4 ${
            isLoading
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-gray-800 cursor-pointer"
          }`}
        >
          {isLoading ? "Playing..." : "🎲 Play (0.01 APT)"}
        </button>

        {txStatus && (
          <div
            className={`p-4 rounded-lg text-[0.95rem] text-center mb-4 ${
              lastResult === "win"
                ? "bg-green-100 text-green-800 border border-green-200"
                : lastResult === "lose"
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            <div className="mb-2">{txStatus}</div>
            {txHash && (
              <div className="text-xs mt-2">
                <a
                  href={getExplorerLink(txHash, "testnet")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  View on Aptos Explorer ↗
                </a>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
          <p className="my-1 leading-relaxed">
            💡 <strong>How it works:</strong>
          </p>
          <p className="my-1 leading-relaxed">
            • Win: Take the entire pot
            <br />• Lose: Your bet adds to the pot
          </p>
        </div>

        {/* Logout Button */}
        <div className="mt-4 text-center">
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
