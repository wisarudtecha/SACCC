// src/core/utils/offlineCache.ts
/**
 * Clears every client-side cache that can outlive a session and carry case/customer PII.
 *
 * On a shared contact-center workstation the next agent to sign in inherits whatever the
 * previous one left on disk, so both copies of the case list have to go:
 *
 *   - IndexedDB — `idbStorage` writes the case list into the `KeyValueStore` object store
 *     under the `caseList` key. (The database also declares a separate `caseList` object
 *     store, but nothing reads or writes it — see `idb.tsx`.)
 *   - localStorage — `insertCaseToLocalStorage` / `updateCaseInLocalStorage` keep an older
 *     copy under the same `caseList` key. Nothing cleared this before.
 *
 * Both modules live in `cms`, so they are loaded on demand to keep `core` free of a static
 * dependency on `cms` — the same reason `sessionTermination` already did this.
 *
 * Each step has its own try/catch: a failure in one must not skip the other, and neither
 * may prevent the caller from completing its teardown. Callers can therefore `await` this
 * without a guard of their own — it never rejects.
 */
export const clearOfflineCache = async (context: string): Promise<void> => {
  try {
    const { idbStorage } = await import("@/cms/components/idb/idb");
    await idbStorage.clear();
  }
  catch (error) {
    console.error(`Failed to clear offline cache during ${context}:`, error);
  }

  try {
    const { clearCaseData } = await import("@/cms/components/case/caseLocalStorage.tsx/caseListUpdate");
    clearCaseData();
  }
  catch (error) {
    console.error(`Failed to clear cached case list during ${context}:`, error);
  }
};
