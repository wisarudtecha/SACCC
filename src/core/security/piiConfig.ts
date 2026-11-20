// src/core/security/piiConfig.ts
/**
 * The switch that decides whether the **frontend** masks PII.
 *
 * The backend owns masking: it decides what to mask, for whom, and returns records with the
 * sensitive fields already redacted. This flag exists only for a deployment whose backend has
 * not shipped that yet — the client-side layer is a fallback, not the security boundary.
 *
 * **Default OFF, and that is a deliberate reversal.** This used to be "on unless an environment
 * says otherwise", following the show-flag convention in `CLAUDE.md` where the product must keep
 * behaving as before for environments that have not been configured. The PII contract settled
 * which layer is in charge, and it is not this one: leaving the client masking by default means
 * every deployment that forgets the key masks twice, and double-masking is not merely redundant,
 * it is lossy (`maskYearOnly` cannot re-parse an already-masked date and collapses it to a full
 * mask). An environment now opts IN to client-side masking.
 *
 * **Display only.** Write protection — rendering an unviewable field as text and omitting it
 * from the update payload — is driven by permissions and stays on regardless of this flag. If it
 * were flagged off too, a pre-masked value would flow straight back into a PATCH and overwrite
 * the real record. See `redactValue` and `omitUnviewableCustomerPii` in `./piiFields.ts`.
 *
 * Vite inlines `import.meta.env` at build time, so this is a per-build constant, not a runtime
 * toggle.
 *
 * Kept in its own module rather than in `piiFields.ts` (whose zero-import purity is deliberate,
 * and which must stay usable outside a Vite build) or in `core/utils/constants.ts` (which pulls
 * in `@/core/icons`).
 */
export const PII_MASKING_ENABLED = import.meta.env.VITE_ENABLE_PII_MASKING === "true";
