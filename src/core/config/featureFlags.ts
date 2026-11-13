// src/core/config/featureFlags.ts
/**
 * Presentation switches read once, at build time.
 *
 * Both are SHOW flags rather than ENABLE flags: the default is ON, and only an
 * explicit "false" hides anything. That direction is deliberate — `.env` and
 * `.env.*` are gitignored in this repo, so an environment that has not been
 * given the key yet must keep behaving exactly as it did before the flag
 * existed. An absent, empty or misspelled value therefore resolves to ON and
 * never silently removes UI.
 *
 * Vite inlines `import.meta.env` when it compiles the app, so changing either
 * value needs a dev-server restart (or a rebuild); it cannot be toggled while
 * the app is running.
 */

/**
 * `"false"` disables; anything else (including absent) enables.
 *
 * Trimmed and lower-cased so `"FALSE"` and `" false "` behave like `"false"` —
 * these files are edited by hand, and a strict `!== "false"` turns a stray
 * space into a silent no-op.
 */
export const readFlag = (raw: string | undefined): boolean =>
  (raw ?? "").trim().toLowerCase() !== "false";

/**
 * Case form: every IoT surface of the create / edit case screens — the Device ID
 * and alert-date fields, the Device layer on the case map (whose info popup holds
 * the only controls that write `iotDevice`), and the read-only IoT rows (the
 * "Device info" panel tab, the overview rows and the case preview).
 *
 * Hiding these is DISPLAY ONLY. `deviceId` and `startedDate` keep travelling in
 * the case payload: the update request replaces the record, so dropping a field
 * just because its input is hidden would wipe the value an existing case already
 * stores.
 */
export const CASE_IOT_ENABLED = readFlag(import.meta.env.VITE_SHOW_CASE_IOT);

/**
 * Entitlements: the "this feature is not in your package" UI — the inline lock
 * block with the sales call-to-action, the sidebar lock badges (and the menu
 * entries they sit on), and the full-page lock state of a route-level gate.
 *
 * `false` renders nothing instead: inline gates disappear, route-level gates
 * redirect to the /cms home rather than showing an empty page, and locked menu
 * entries are filtered out of the sidebar so no dead link is left behind.
 *
 * The tenant's own Subscription & Entitlements settings page is NOT affected —
 * that is contract information, not an upsell.
 */
export const ENTITLEMENT_UPSELL_ENABLED = readFlag(
  import.meta.env.VITE_SHOW_ENTITLEMENT_UPSELL,
);
