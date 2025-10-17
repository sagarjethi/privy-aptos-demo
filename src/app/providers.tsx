"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId="cmgg7mhpt00ujl40czx4gaxfm">{children}</PrivyProvider>
  );
}
