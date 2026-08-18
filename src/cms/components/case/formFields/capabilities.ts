/**
 * What a case form is allowed to do, independent of any particular screen. Each
 * flag used to be inferred from a single `isCreate` boolean; they are separate
 * now so a screen can mix them without a new mode being invented for it.
 */
export interface CaseFormCapabilities {
    /** Lock the case type - it cannot be changed once the case exists. */
    lockCaseType: boolean;
    /** Lock the service center. */
    lockArea: boolean;
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
    lockArea: !isCreate,
    showAttachments: isCreate,
    autoFetchTypeForm: isCreate,
    defaultIotDate: isCreate,
});
