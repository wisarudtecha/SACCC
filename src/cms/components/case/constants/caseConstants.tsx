export const COMMON_INPUT_CSS = "focus:border-brand-300 focus:ring-brand-500/20 h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  appearance-none border !border-1 rounded text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent dark:text-gray-300 dark:border-gray-800 dark:bg-gray-900 disabled:text-gray-500 disabled:border-gray-300 disabled:opacity-40 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-400 dark:disabled:border-gray-700";

export const REQUIRED_ELEMENT = <span className="text-red-500 text-sm font-bold">*</span>;

export const TOAST_MESSAGES = {
    SAVE_SUCCESS: "Changes saved successfully!",
    SAVE_DRAFT_SUCCESS: "Save As Draft successfully!",
    CREATE_SUCCESS: "Create Case successfully!",
    DISPATCH_SUCCESS: "Dispatch Successfully!",
    DISPATCH_FAILED: "Dispatch Failed",
    UPDATE_FAILED: "Failed to Update Case",
    CREATE_FAILED: "Failed to Create Case"
} as const;

export const detailsStringLimit=4000

export const resultStringLimit=1000

import { socialCaseSources } from "@/cms/utils/customerSocial.policy";

/**
 * How a case reached the contact centre.
 *
 * The legacy entries are a hand-maintained mirror of a backend table — note the missing
 * `03`, which is why the ids here are not ours to invent.
 *
 * The social channels are appended from `SOCIAL_PROVIDERS` rather than written out, so a
 * new channel is one registry entry rather than an edit in two places. `socialCaseSources`
 * yields only providers that have been given a `caseSourceId`; until the backend assigns
 * those, it returns nothing and this list is byte-for-byte what it always was.
 */
export const source = [
    { name: "CALL", id: "01" },
    { name: "METTLINK", id: "02" },
    { name: "METTRIQ", id: "04" },
    { name: "IOT-Alert", id: "05" },
    { name: "Other", id: "06" },
    // `caseSourceLabel` is typed optional because PHONE/EMAIL never set it, but
    // `socialCaseSources()` only returns providers that also carry a `caseSourceId` (LINE,
    // FACEBOOK, TEXTCHAT), and every one of those sets both together — the fallback below
    // only exists to satisfy that gap in the type, not because it can happen today.
    ...socialCaseSources().map(provider => ({
        name: provider.caseSourceLabel ?? provider.id,
        id: provider.caseSourceId as string,
    })),
];