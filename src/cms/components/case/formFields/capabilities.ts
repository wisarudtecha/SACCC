/**
 * What a case form is allowed to do, independent of any particular screen. Each
 * flag used to be inferred from a single `isCreate` boolean; they are separate
 * now so a screen can mix them without a new mode being invented for it.
 */
export interface CaseFormCapabilities {
    /** Lock the case type - it cannot be changed once the case exists. */
    lockCaseType: boolean;
    /**
     * Hard-lock the Service Center: disable the field AND skip incident-polygon
     * matching entirely. Both create and edit now leave this `false` (edit mode
     * gained the map-driven match); a live single-polygon match still re-locks
     * the field via `autoLockedArea`. Kept as an overridable flag so a future
     * read-only screen can pass `lockArea: true`.
     */
    lockArea: boolean;
    /**
     * Lock the service center because the incident location resolved to exactly
     * one Service Center polygon at create time. Kept separate from `lockArea`:
     * the trigger is different (an automatic match, not "the case exists"), it
     * only applies to the create screen, and the dispatcher-facing explanation
     * differs. Screens seed it `false`; CaseFormFields raises it live when a
     * match succeeds.
     */
    autoLockedArea: boolean;
    /** Show the attachments uploader. */
    showAttachments: boolean;
    /** Re-fetch the dynamic form when the case type changes. */
    autoFetchTypeForm: boolean;
    /** Default the IoT alert date to now when the case has none. */
    defaultIotDate: boolean;
}

/** The create/edit presets the app has today. `isCreate` maps onto these. */
export const capabilitiesForMode = (isCreate: boolean): CaseFormCapabilities => ({
    lockCaseType: !isCreate,
    // `false` in both presets: the Service Center is editable in edit mode too,
    // and the incident-polygon match runs there (gated on `!lockArea` in
    // CaseFormFields). A single match still auto-locks the field live.
    lockArea: false,
    // Off by default in both presets - only a live incident-polygon match raises
    // it, and only on the create screen (see CaseFormFields).
    autoLockedArea: false,
    showAttachments: isCreate,
    autoFetchTypeForm: isCreate,
    defaultIotDate: isCreate,
});
