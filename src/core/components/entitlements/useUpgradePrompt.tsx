// src/core/components/entitlements/useUpgradePrompt.tsx
import { useState } from "react";
import { UpgradeModal } from "./UpgradeModal";
import type { EntitlementFeature } from "@/core/types/entitlement";

/**
 * Local-state upgrade prompt: call `promptFor(feature)` to open the modal,
 * render `modal` anywhere in the caller's tree. Provider-free by design so
 * it works in the sidebar, gates, and settings pages alike.
 */
export function useUpgradePrompt() {
  const [feature, setFeature] = useState<EntitlementFeature | null>(null);

  return {
    promptFor: (next: EntitlementFeature) => setFeature(next),
    modal: feature ? (
      <UpgradeModal feature={feature} onClose={() => setFeature(null)} />
    ) : null,
  };
}
