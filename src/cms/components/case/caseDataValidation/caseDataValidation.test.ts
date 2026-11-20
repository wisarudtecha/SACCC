// src/cms/components/case/caseDataValidation/caseDataValidation.test.ts
//
// The phone check below is a **format** check on a value the user typed. Once the backend
// redacts the number for a viewer without `pii.case.phoneNo`, form state holds the redaction
// (`******5678`), which fails the pattern — and the field is locked, so the viewer cannot correct
// it. Every save would be blocked by a value they were never allowed to change.
//
// Pinned here because the symptom reads as "validation is broken" rather than "permissions are
// working", and the fix (skipping the check) looks like a loophole until you notice whose input
// it is.
import { describe, expect, it } from "vitest";
import type { CaseDetails } from "@/cms/types/case";
import { validateCaseForSubmission } from "./caseDataValidation";

/**
 * Only the fields `validateCaseForSubmission` reads.
 *
 * `caseType.formField` is deliberately absent: the dynamic-form branch is skipped when there is
 * no form definition, which keeps this fixture about the phone check.
 */
const buildCase = (mobileNo: string | undefined): CaseDetails =>
    ({
        caseType: { caseType: "CRIMINAL" },
        description: "Broken window",
        source: { name: "CALL" },
        area: {},
        customerData: { mobileNo },
    } as unknown as CaseDetails);

describe("validateCaseForSubmission — phone number", () => {
    it("accepts a real number the viewer may edit", () => {
        expect(validateCaseForSubmission(buildCase("0812345678"))).toBe("");
        expect(validateCaseForSubmission(buildCase("+66812345678"))).toBe("");
    });

    it("rejects a malformed number when the viewer is the one who typed it", () => {
        expect(validateCaseForSubmission(buildCase("0812"))).toBe("Invalid Phone Number.");
    });

    it("skips the check for a viewer who may not edit the field", () => {
        // The exact value the backend sends once it redacts: it fails the pattern, and that must
        // not stop the case being saved.
        expect(validateCaseForSubmission(buildCase("******5678"))).toBe("Invalid Phone Number.");
        expect(
            validateCaseForSubmission(buildCase("******5678"), { canViewPhoneNo: false })
        ).toBe("");
        // The trade-off, stated: an unviewable phone is never format-checked, because a locked
        // field cannot be corrected.
        expect(validateCaseForSubmission(buildCase("0812"), { canViewPhoneNo: false })).toBe("");
    });

    it("says nothing about an absent number", () => {
        expect(validateCaseForSubmission(buildCase(undefined))).toBe("");
        expect(
            validateCaseForSubmission(buildCase(undefined), { canViewPhoneNo: false })
        ).toBe("");
    });
});
