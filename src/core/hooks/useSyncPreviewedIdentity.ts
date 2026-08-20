// src/core/hooks/useSyncPreviewedIdentity.ts
import { useEffect } from "react";

/**
 * Notifies the caller when the identity being previewed (e.g. a username) genuinely changes.
 *
 * Tab content inside PreviewDialog unmounts/remounts on every tab switch, so a comparison
 * baseline that lives in the tab component itself (local state) resets on every switch and
 * can't tell a real identity change from a same-value remount. `trackedId` must instead come
 * from state the parent persists across those remounts (e.g. the username currently driving
 * the parent's data fetch), so a remount with an unchanged `previewedId` is correctly a no-op.
 */
export function useSyncPreviewedIdentity(
  previewedId: string,
  trackedId: string,
  onChange: (id: string) => void
) {
  useEffect(() => {
    if (previewedId && previewedId !== trackedId) {
      onChange(previewedId);
    }
  }, [previewedId, trackedId, onChange]);
}
