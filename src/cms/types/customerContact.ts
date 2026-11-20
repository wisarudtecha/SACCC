// src/cms/types/customerContact.ts
/**
 * A customer's contact record — a named person plus the phone number to reach them on.
 *
 * Contract: `src/cms/mocks/customerContactCURL.sh` (`GetListCustomerContact`,
 * `GetCustomerContactById`, `UpdateCustomerContact`).
 *
 * Distinct from `CustomerContactDefault`, which is one record per customer naming the *primary*
 * channel. This entity is the list of people a customer account keeps, each with their own
 * number, and `contactPhone` is PII (`CONTACT_PII_FIELDS` in `src/core/security/piiFields.ts`).
 *
 * `contactAddr` is **not** classified by the contract even though the customer's own address is:
 * the published PII matrix lists only `contactPhone` for this entity. That is a known divergence,
 * not an oversight in this file — see the Phase 4 notes.
 */

export interface CustomerContactAddress {
    building?: string;
    country?: string;
    district?: string;
    floor?: string;
    lat?: string;
    lon?: string;
    postalCode?: string;
    province?: string;
    road?: string;
    room?: string;
    street?: string;
    subDistrict?: string;
    /**
     * Absent from the contract sample but present on `Customer.address`, and the form that edits
     * this record is the same address component — kept optional so a payload carrying it still
     * satisfies the type.
     */
    no?: string;
}

export interface CustomerContact {
    id: string;
    orgId?: string;
    custId: number | string;
    contactName?: string;
    /** PII. `CONTACT_PII_FIELDS.contactPhone` — `lastN`, keep 4. */
    contactPhone?: string;
    contactAddr?: CustomerContactAddress;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}

/**
 * Everything `UpdateCustomerContact` accepts.
 *
 * `id` is required: the mutation is keyed on it (`CustomerContactInput` carries `id`, `custId`,
 * `contactName`, `contactPhone`, `contactAddr`). `custId` is required too — the record is scoped
 * to a customer and the input type does not define it as optional.
 */
export interface UpdateCustomerContactInput {
    id: string;
    custId: number | string;
    contactName?: string;
    contactPhone?: string;
    contactAddr?: CustomerContactAddress;
}

/**
 * Structural check on an unknown payload.
 *
 * Needed because `normalizeToApiResponse` (`src/core/utils/gqlUtils.ts`) coerces an absent
 * `data` to `[]`, and `Boolean([])` is `true` — so "no record" and "a record" are only
 * distinguishable by shape. `id` and `custId` are the two fields every persisted row has.
 */
export const isCustomerContact = (value: unknown): value is CustomerContact => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const candidate = value as Record<string, unknown>;
    const isKey = (key: unknown): boolean =>
        typeof key === "string" || (typeof key === "number" && Number.isFinite(key));

    return isKey(candidate.id) && isKey(candidate.custId);
};
