// src/cms/components/case/caseListSignal.ts
/**
 * Announces that the cached case list changed.
 *
 * The app reuses the DOM `storage` event as an in-page pub/sub channel. It used to carry
 * the whole case list in `newValue` (`JSON.stringify(await idbStorage.getItem("caseList"))`),
 * which handed every `window` listener — including anything injected into the page — the
 * full payload: customer names, phone numbers and addresses.
 *
 * The payload was never needed. IndexedDB is the source of truth and listeners re-read it,
 * so this dispatches a change *signal* instead: which case changed, and when. `caseId` is
 * omitted when a change spans the whole list (a full reload, or an emptied list).
 *
 * Kept dependency-free on purpose — it is called from both `cms` and `core`.
 */
export const CASE_LIST_STORAGE_KEY = "caseList";

export const notifyCaseListChanged = (caseId?: string): void => {
  window.dispatchEvent(new StorageEvent("storage", {
    key: CASE_LIST_STORAGE_KEY,
    // A non-null value keeps this distinguishable from a genuine `removeItem` event, and
    // gives listeners something to key off without exposing any case content.
    newValue: JSON.stringify({ caseId: caseId ?? null, changedAt: Date.now() }),
  }));
};
