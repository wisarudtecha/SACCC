// src/cms/types/customerNote.ts
/**
 * Internal customer notes, as delivered by the BFF (see
 * `src/cms/mocks/customerNoteCURL.sh` for the live contract).
 *
 * The stored entity is deliberately thin: a note is one `note` string against one
 * customer. There is no category column — categories are encoded as trailing hashtags
 * inside `note` and decoded for display by `src/cms/utils/customerNoteTags.ts`.
 *
 * There is likewise no `isEdited` flag; `isNoteEdited` in `customerNote.policy.ts`
 * derives it from `updatedAt` vs `createdAt`.
 */

/**
 * A category tag, not a stored field. The preset list lives in `NOTE_CATEGORIES`
 * (`customerNote.policy.ts`) and is what the tag codec will recognise.
 */
export type NoteCategory = "General" | "Billing" | "Support" | "Sales";

export interface CustomerNote {
  id: string;
  orgId?: string;
  /** The customer's numeric primary key, per the backend samples. */
  custId: number | string;
  /** Raw stored text, tags included. Decode before rendering. */
  note: string;
  /** Username of the author. Authoritative for edit/delete gating. */
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * The list endpoint accepts only these. There is no `search` and no category filter —
 * with tags living inside the text, neither is possible server-side today.
 */
export interface CustomerNoteListParams {
  customerId: string;
  start?: number;
  length?: number;
  orderBy?: string;
  direction?: string;
}

export interface CreateCustomerNoteInput {
  customerId: string;
  /** Already encoded, tags and all. */
  note: string;
}

export interface UpdateCustomerNoteInput {
  customerId: string;
  id: string;
  note: string;
}

export interface DeleteCustomerNoteInput {
  id: string;
}
