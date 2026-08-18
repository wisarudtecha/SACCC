// src/cms/hooks/useNoteDraft.ts
/**
 * Keeps the note composer's unsaved text across an accidental tab close or reload.
 *
 * The key is scoped by BOTH username and customer id. Agents share workstations, so
 * an unscoped key would show one agent's half-written note to the next person at the
 * desk, and a customer-only key would carry text between customers as the panel
 * switches.
 *
 * Writes are debounced so typing doesn't hit localStorage on every keystroke; there
 * is no shared `useDebounce` in this codebase (`core/hooks/index.ts` has it commented
 * out), so the timer lives here.
 *
 * LIMITATION: there is no logout hook to clear drafts on sign-out, so a draft that is
 * never saved or discarded persists on the machine. Anything typed here is internal
 * customer data — `clear()` is called on a successful save, which covers the normal
 * path, but an abandoned draft survives.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const DRAFT_KEY_PREFIX = "noteDraft";
const DEBOUNCE_MS = 500;

export interface UseNoteDraftResult {
  /** The persisted draft as of mount / last key change. Empty when there is none. */
  initialDraft: string;
  /** Queue a debounced write. Passing an empty string clears the draft instead. */
  saveDraft: (content: string) => void;
  /** Drop the draft immediately and cancel any pending write. */
  clearDraft: () => void;
}

const buildKey = (username: string, customerId: string): string =>
  `${DRAFT_KEY_PREFIX}:${username}:${customerId}`;

export const useNoteDraft = (username?: string, customerId?: string): UseNoteDraftResult => {
  const isEnabled = Boolean(username && customerId);
  const storageKey = isEnabled ? buildKey(username as string, customerId as string) : "";

  const [initialDraft, setInitialDraft] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingWrite = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // A changed key is a different draft entirely — re-read rather than carry the old
  // one over into another customer's composer.
  useEffect(() => {
    cancelPendingWrite();

    if (!storageKey) {
      setInitialDraft("");
      return;
    }

    try {
      setInitialDraft(localStorage.getItem(storageKey) || "");
    }
    catch (error) {
      console.error("🚀 ~ useNoteDraft ~ Failed to read draft:", error);
      setInitialDraft("");
    }
  }, [storageKey, cancelPendingWrite]);

  // A pending write must not fire after the component is gone, or it would resurrect
  // a draft the user just saved.
  useEffect(() => cancelPendingWrite, [cancelPendingWrite]);

  const clearDraft = useCallback(() => {
    cancelPendingWrite();
    if (!storageKey) {
      return;
    }

    try {
      localStorage.removeItem(storageKey);
    }
    catch (error) {
      console.error("🚀 ~ useNoteDraft ~ Failed to clear draft:", error);
    }
    setInitialDraft("");
  }, [storageKey, cancelPendingWrite]);

  const saveDraft = useCallback((content: string) => {
    if (!storageKey) {
      return;
    }

    cancelPendingWrite();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      try {
        // An emptied composer means "no draft", not "a draft of nothing" — otherwise
        // clearing the box would leave a stale entry behind forever.
        if (content.trim() === "") {
          localStorage.removeItem(storageKey);
          return;
        }
        localStorage.setItem(storageKey, content);
      }
      catch (error) {
        console.error("🚀 ~ useNoteDraft ~ Failed to save draft:", error);
      }
    }, DEBOUNCE_MS);
  }, [storageKey, cancelPendingWrite]);

  return { initialDraft, saveDraft, clearDraft };
};
