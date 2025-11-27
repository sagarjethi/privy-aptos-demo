"use client";

import { PrivyProvider } from "@privy-io/react-auth";

/**
 * Privy Provider Configuration for Aptos Demo
 * 
 * Features enabled:
 * - Multiple login methods (email, SMS, wallet, social)
 * - Embedded wallet creation for Aptos
 * - Custom appearance
 * - Aptos chain support via extended-chains
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  // Get app ID from environment variable or use default
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmhq4q7z600v7jp0b6aj2raaj";

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Login methods - multiple options for better UX
        loginMethods: [
          "email",
          "sms",
          "wallet",
          "google",
          "twitter",
          "github",
          "apple",
          "discord",
        ],
        // Appearance customization
        appearance: {
          theme: "light",
          accentColor: "#000000",
          logo: undefined,
          showWalletLoginFirst: false,
        },
        // Embedded wallet configuration for Aptos
        embeddedWallets: {
          // Note: Aptos wallet creation is handled via useCreateWallet hook
          // from @privy-io/react-auth/extended-chains
        },
        // Legal and terms (optional)
        legal: {
          termsAndConditionsUrl: undefined,
          privacyPolicyUrl: undefined,
        },
        // MFA configuration
        mfa: {
          noPromptOnMfaRequired: false, // Show MFA prompts when required
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
