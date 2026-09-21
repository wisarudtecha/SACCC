// The provider-neutral half of "move the camera when the caller asks".
//
// Each provider supplies only how to move its own camera (`apply`); deciding
// WHEN a request is new lives here once. Deliberately free of any map SDK, so the
// three providers can share it without one provider's chunk pulling in another's.
import { useEffect, useRef } from "react";
import type { MapFocusRequest } from "./mapTypes";

interface UseFocusRequestEffectOptions {
  focusRequest: MapFocusRequest | null | undefined;
  /** True once the map has resolved; the camera is only safe to move after this. */
  isReady: boolean;
  /** Moves the provider's camera. Read through a ref, so it need not be stable. */
  apply: (request: MapFocusRequest) => void;
}

/**
 * Calls `apply` once for each new request.
 *
 * "New" means a nonce this map has not handled - and that includes the request
 * that already existed when it mounted. The large map is unmounted on close and
 * rebuilt on reopen while the request is still held upstairs; replaying it would
 * yank the restored camera back to wherever "focus" was last pressed.
 */
export function useFocusRequestEffect({
  focusRequest,
  isReady,
  apply
}: UseFocusRequestEffectOptions): void {
  const handledNonceRef = useRef<number | undefined>(focusRequest?.nonce);
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    if (!isReady || !focusRequest) {
      return;
    }
    if (handledNonceRef.current === focusRequest.nonce) {
      return;
    }
    handledNonceRef.current = focusRequest.nonce;
    applyRef.current(focusRequest);
  }, [isReady, focusRequest]);
}
