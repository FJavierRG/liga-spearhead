"use client";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { useLoadingGate } from "@/hooks/use-loading-gate";

export function MainContentGate({ children }: { children: React.ReactNode }) {
  const showLoading = useLoadingGate(true);

  if (showLoading) {
    return <LoadingScreen fill />;
  }

  return children;
}
