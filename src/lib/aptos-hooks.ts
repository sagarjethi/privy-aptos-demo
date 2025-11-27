"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { octasToAPT } from "./aptos-utils";

interface AptosWallet {
  address: string;
  publicKey: string;
}

/**
 * Hook to get Aptos wallet from Privy user
 */
export function useAptosWallet(): AptosWallet | null {
  const { user } = usePrivy();

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
}

/**
 * Hook to get and monitor Aptos wallet balance
 */
export function useAptosBalance(network: Network = Network.TESTNET) {
  const wallet = useAptosWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aptos = new Aptos(new AptosConfig({ network }));

  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallet?.address) {
        setBalance(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const balanceOctas = await aptos.getAccountAPTAmount({
          accountAddress: AccountAddress.from(wallet.address),
        });
        setBalance(octasToAPT(balanceOctas.toString()));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch balance";
        setError(errorMessage);
        console.error("Error fetching balance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.address, network]);

  return { balance, loading, error };
}

