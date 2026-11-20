// src/cms/types/customerContact.test.ts
//
// The guard exists because `normalizeToApiResponse` coerces an absent `data` to `[]`, and
// `Boolean([])` is `true` — so "no record" and "a record" are only distinguishable by shape.
// A truthiness check here would render a nameless row for every empty response.
import { describe, expect, it } from "vitest";
import { isCustomerContact } from "./customerContact";

describe("isCustomerContact", () => {
    it("accepts a persisted row", () => {
        expect(isCustomerContact({ id: "1", custId: 1, contactPhone: "0809950000" })).toBe(true);
        // The contract quotes ids inconsistently; both directions are real rows.
        expect(isCustomerContact({ id: 1, custId: "1" })).toBe(true);
    });

    it("rejects the shapes that stand in for 'no record'", () => {
        expect(isCustomerContact(null)).toBe(false);
        expect(isCustomerContact(undefined)).toBe(false);
        // What `data: null` becomes.
        expect(isCustomerContact([])).toBe(false);
        expect(isCustomerContact("1")).toBe(false);
    });

    it("rejects a row without both keys", () => {
        expect(isCustomerContact({ id: "1" })).toBe(false);
        expect(isCustomerContact({ custId: 1 })).toBe(false);
        expect(isCustomerContact({ id: Number.NaN, custId: 1 })).toBe(false);
        expect(isCustomerContact({ id: {}, custId: 1 })).toBe(false);
    });
});
