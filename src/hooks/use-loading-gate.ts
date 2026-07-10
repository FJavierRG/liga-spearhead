"use client";

import { useEffect, useRef, useState } from "react";

export const MIN_LOADING_MS = 2000;

export function useLoadingGate(ready: boolean) {
  const mountTime = useRef(Date.now());
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!ready || revealed) return;

    const remaining = MIN_LOADING_MS - (Date.now() - mountTime.current);
    const id = window.setTimeout(
      () => setRevealed(true),
      Math.max(0, remaining)
    );
    return () => window.clearTimeout(id);
  }, [ready, revealed]);

  return !revealed;
}
