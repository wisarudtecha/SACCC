// src/core/security/piiConfig.ts
/**
 * The switch that decides whether the **frontend** masks PII.
 *
 * The backend now owns masking: it decides what to mask, for whom, and returns records with the
 * sensitive fields already redacted. This flag turns the client-side masking layer off so the
 * two do not stack — double-masking is not merely redundant, it is lossy (`maskYearOnly` cannot
 * re-parse an already-masked `••/••/1990` and collapses it to a full mask).
 *
 * **Display only.** Write protection — rendering an unviewable field as text and omitting it
 * from the update payload — is driven by permissions and stays on regardless of this flag. If it
 * were flagged off too, a pre-masked value would flow straight back into a PATCH and overwrite
 * the real record. See `omitUnviewableCustomerPii` in `./piiFields.ts`.
 *
 * **Fails closed.** Only the literal string `"false"` disables masking, so an environment file
 * that forgets the key keeps masking rather than silently exposing data. Vite inlines
 * `import.meta.env` at build time, so this is a per-build constant, not a runtime toggle.
 *
 * Kept in its own module rather than in `piiFields.ts` (whose zero-import purity is deliberate,
 * and which must stay usable outside a Vite build) or in `core/utils/constants.ts` (which pulls
 * in `@/core/icons`).
 */
export const PII_MASKING_ENABLED = import.meta.env.VITE_ENABLE_PII_MASKING !== "false";
