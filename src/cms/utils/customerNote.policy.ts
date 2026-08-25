// src/cms/utils/customerNote.policy.ts
/**
 * The decisions about customer notes that don't belong to any one component:
 * what counts as a note, whether a write actually succeeded, who may edit one,
 * and which categories exist.
 *
 * These are grouped here deliberately. Each is a point where the backend contract
 * is still unconfirmed, so keeping them in one small module means "the backend
 * answered" is a local edit rather than a hunt through the component tree.
 */
import { readEntityVerdict } from "@/core/utils/apiResponseStatus";
import type { EntityVerdict, EnvelopeLike } from "@/core/utils/apiResponseStatus";
import type { CustomerNote, NoteCategory } from "@/cms/types/customerNote";
import type { User } from "@/core/types/auth";

/**
 * The categories offered in the editor and the filter bar.
 *
 * OPEN QUESTION (backend): whether categories stay a fixed FE list or become a
 * managed lookup like `appointmentType`/`serviceType`. If they become managed,
 * `useNoteCategories` (src/cms/hooks/useNoteCategories.ts) swaps its body for an
 * RTK Query call and this constant becomes the offline/mock fallback — callers
 * of the hook are unaffected either way.
 *
 * Labels are NOT stored here: they go through `t()` at render time so the three
 * i18n catalogues stay authoritative.
 */
export const NOTE_CATEGORIES: readonly NoteCategory[] = Object.freeze([
  "General",
  "Billing",
  "Support",
  "Sales",
]);

export const isNoteCategory = (value: unknown): value is NoteCategory =>
  typeof value === "string" && (NOTE_CATEGORIES as readonly string[]).includes(value);

/**
 * Structural check on an unknown payload.
 *
 * Used as the evidence half of `readNoteVerdict`: `normalizeToApiResponse`
 * (src/core/utils/gqlUtils.ts) coerces a null/absent payload to `[]`, so a value
 * that satisfies this guard can only have come from the server actually returning
 * a note.
 */
export const isCustomerNote = (value: unknown): value is CustomerNote => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string"
    && typeof candidate.note === "string"
    && typeof candidate.createdBy === "string";
};

/**
 * Whether a note has been changed since it was written.
 *
 * The backend sends no explicit flag, but it does stamp both timestamps and leaves
 * them identical on create (see the samples in `customerNoteCURL.sh`), so the
 * comparison is the signal. Guarded on `updatedAt` being present at all, since it is
 * optional on the type.
 */
export const isNoteEdited = (note: Pick<CustomerNote, "createdAt" | "updatedAt">): boolean =>
  Boolean(note.updatedAt) && note.updatedAt !== note.createdAt;

/**
 * Did this write actually succeed?
 *
 * Not a rhetorical question here. The hybrid base query now rejects a *conclusive*
 * business failure (`{ status: false, ... }`), but an INCONCLUSIVE envelope — no status,
 * or one it cannot read — still arrives FULFILLED, and `normalizeToApiResponse` coerces
 * its null payload to a truthy `[]`. A caller that treats a resolved promise as success
 * will clear the editor and throw away the agent's text while telling them it was saved.
 *
 * `readEntityVerdict` encodes the "only report success on positive evidence" bias;
 * this wrapper just fixes the entity guard so callers can't pass the wrong one.
 *
 * OPEN QUESTION (backend): whether create/update return the saved note or only a
 * status string. `verdict.entity` is `undefined` in the latter case, which is why
 * the mutations invalidate their tag and refetch instead of prepending the response
 * to local state. Once the backend confirms it returns the entity, the facade can
 * start consuming `verdict.entity` directly and an optimistic update becomes safe.
 */
export const readNoteVerdict = (
  response: EnvelopeLike | null | undefined
): EntityVerdict<CustomerNote> => readEntityVerdict(response, isCustomerNote);

/**
 * Deletes carry no entity to inspect — `data` is coerced to `[]` either way — so the only
 * signal is the envelope's own status.
 *
 * Lifted into `@/core/utils/apiResponseStatus` once customer socials became a second
 * caller of the identical rule; that module's header already names itself the seed for
 * exactly this consolidation. Re-exported here so existing importers are unaffected.
 */
export { readDeleteOutcome } from "@/core/utils/apiResponseStatus";

/**
 * Who may edit or delete a note: its author, or a system admin.
 *
 * Author identity is `note.createdBy` (a username) compared against the logged-in
 * `user.username`. Read the user from `useAuth()`, not from the `profile` blob in
 * localStorage — that read exists in `Comment.tsx` but is not a pattern to extend.
 *
 * This is a UX affordance only. It decides whether the buttons render; it cannot
 * stop a request. The backend must enforce the same rule independently.
 *
 * OPEN QUESTION (backend): whether edit/delete are author-scoped server-side, and
 * whether delete is soft (an audit trail) or hard. If a note gains a `deletedAt`,
 * the "already deleted" case gets handled here too.
 */
export const canEditNote = (
  note: Pick<CustomerNote, "createdBy">,
  user: User | null,
  isSystemAdmin: boolean
): boolean => {
  if (isSystemAdmin) {
    return true;
  }
  if (!user?.username || !note.createdBy) {
    return false;
  }
  return user.username === note.createdBy;
};
