import { AccountAddress } from "@aptos-labs/ts-sdk";

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string, length: number = 6): string {
  if (!address) return "";
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

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

/**
 * Convert APT to octas
 * 1 APT = 100,000,000 octas
 */
export function aptToOctas(apt: number): bigint {
  return BigInt(Math.floor(apt * 100000000));
}

/**
 * Format APT amount with proper decimal places
 */
export function formatAPT(amount: number, decimals: number = 4): string {
  return amount.toFixed(decimals);
}

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

/**
 * Generate Aptos Explorer link for transaction
 */
export function getExplorerLink(
  transactionHash: string,
  network: "testnet" | "mainnet" = "testnet"
): string {
  const baseUrl = "https://explorer.aptoslabs.com";
  return `${baseUrl}/txn/${transactionHash}?network=${network}`;
}

/**
 * Generate Movement Explorer link for transaction
 */
export function getMovementExplorerLink(transactionHash: string): string {
  return `https://explorer.movementnetwork.xyz/txn/${transactionHash}?network=bardock+testnet`;
}

