"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export function RetryButton({ onRetry, children }: { readonly onRetry: () => Promise<unknown>; readonly children?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      onClick={async () => {
        setBusy(true);
        try { await onRetry(); } finally { setBusy(false); }
      }}
      disabled={busy}
    >
      {busy ? "Retrying…" : (children ?? "Retry")}
    </Button>
  );
}
