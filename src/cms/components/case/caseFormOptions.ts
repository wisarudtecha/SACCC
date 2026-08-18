import { Area } from "@/cms/store/api/area";
import { Customer } from "@/cms/store/api/custommerApi";
import { CaseTypeSubType } from "@/cms/types/case";

/**
 * Reference data for the case form is cached in localStorage by the app shell.
 *
 * These readers exist so form components can accept the lists as props - and so
 * be used with any data source - while still defaulting to the cache that every
 * current screen relies on.
 */
const readCachedList = <T>(key: string): T[] => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T[]) : [];
    } catch (error) {
        console.error(`Failed to read cached "${key}" list:`, error);
        return [];
    }
};

export const readCachedCaseTypeSubTypes = (): CaseTypeSubType[] =>
    readCachedList<CaseTypeSubType>("caseTypeSubType");

export const readCachedAreas = (): Area[] =>
    readCachedList<Area>("area");

export const readCachedCustomers = (): Customer[] =>
    readCachedList<Customer>("customer_data");
