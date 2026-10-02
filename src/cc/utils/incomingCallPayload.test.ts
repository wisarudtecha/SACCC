import { describe, expect, it } from "vitest";
import {
  extractCaseSummaries,
  extractCustomer,
  selectRecentCases,
  type CaseSummary,
  type CustomerSummary,
} from "./incomingCallPayload";

const CUSTOMER = {
  id: "cust-42",
  orgId: "org-1",
  displayName: "Jane W.",
  title: "Ms.",
  firstName: "Jane",
  middleName: "",
  lastName: "Wong",
  citizenId: "1103xxxxxxxxx",
  mobileNo: "0811223344",
  email: "jane@example.com",
  photo: "/photos/jane.png",
  userType: "Gold",
};

function customerEnvelope(data: unknown) {
  return { status: "1", msg: "success", data };
}

describe("extractCustomer", () => {
  it("maps a valid customer envelope to the summary subset", () => {
    const summary = extractCustomer(customerEnvelope(CUSTOMER));
    expect(summary).toEqual({
      id: "cust-42",
      displayName: "Jane W.",
      firstName: "Jane",
      lastName: "Wong",
      mobileNo: "0811223344",
      email: "jane@example.com",
      photo: "/photos/jane.png",
    } satisfies CustomerSummary);
  });

  it("returns null for an empty-array data payload (the envelope coercion trap)", () => {
    // normalizeToApiResponse substitutes data ?? [] when the server omits the
    // field, so a resolved "no match" response arrives as data: [].
    expect(extractCustomer(customerEnvelope([]))).toBeNull();
  });

  it("returns null for null, primitives and missing data", () => {
    expect(extractCustomer(null)).toBeNull();
    expect(extractCustomer(undefined)).toBeNull();
    expect(extractCustomer("customer")).toBeNull();
    expect(extractCustomer(customerEnvelope(null))).toBeNull();
    expect(extractCustomer(customerEnvelope(undefined))).toBeNull();
  });

  it("returns null when the payload has no usable id", () => {
    expect(extractCustomer(customerEnvelope({ ...CUSTOMER, id: "" }))).toBeNull();
    expect(extractCustomer(customerEnvelope({ displayName: "No id" }))).toBeNull();
  });

  it("tolerates missing optional display fields", () => {
    const summary = extractCustomer(
      customerEnvelope({ id: "cust-7", displayName: "Ann" })
    );
    expect(summary).toEqual({
      id: "cust-7",
      displayName: "Ann",
      firstName: "",
      lastName: "",
      mobileNo: "",
      email: "",
      photo: "",
    });
  });
});

const CASES = [
  { caseId: "D260708-00003", statusId: "S003", priority: 2, receivedDate: "2026-10-01T08:00:00.000Z" },
  { caseId: "D260708-00001", statusId: "S001", priority: 1, receivedDate: "2026-10-02T10:30:00.000Z" },
  { caseId: "D260708-00002", statusId: "S002", priority: 3, receivedDate: "2026-10-01T09:15:00.000Z" },
];

function caseEnvelope(data: unknown) {
  return { status: "1", msg: "success", data };
}

describe("extractCaseSummaries", () => {
  it("maps every valid case entry to the summary subset", () => {
    const summaries = extractCaseSummaries(caseEnvelope(CASES));
    expect(summaries).toHaveLength(3);
    expect(summaries[0]).toEqual({
      caseId: "D260708-00003",
      statusId: "S003",
      priority: 2,
      receivedDate: "2026-10-01T08:00:00.000Z",
    } satisfies CaseSummary);
  });

  it("returns an empty list for an empty or absent data payload", () => {
    expect(extractCaseSummaries(caseEnvelope([]))).toEqual([]);
    expect(extractCaseSummaries(caseEnvelope(undefined))).toEqual([]);
  });

  it("returns an empty list for null and non-object envelopes", () => {
    expect(extractCaseSummaries(null)).toEqual([]);
    expect(extractCaseSummaries("cases")).toEqual([]);
  });

  it("skips entries without a usable caseId but keeps the rest", () => {
    const summaries = extractCaseSummaries(
      caseEnvelope([{ statusId: "S001" }, CASES[0], { caseId: "" }])
    );
    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.caseId).toBe("D260708-00003");
  });

  it("defaults missing optional fields instead of failing the whole list", () => {
    const summaries = extractCaseSummaries(caseEnvelope([{ caseId: "D260708-00009" }]));
    expect(summaries).toEqual([
      { caseId: "D260708-00009", statusId: "", priority: 0, receivedDate: "" },
    ]);
  });
});

describe("selectRecentCases", () => {
  it("sorts cases newest first by receivedDate", () => {
    const selected = selectRecentCases(
      [CASES[0], CASES[1], CASES[2]].map(toSummary),
      undefined,
      3
    );
    expect(selected.map((item) => item.caseId)).toEqual([
      "D260708-00001",
      "D260708-00002",
      "D260708-00003",
    ]);
  });

  it("limits the result to the requested count", () => {
    const many: CaseSummary[] = Array.from({ length: 10 }, (_, index) => ({
      caseId: `C-${index}`,
      statusId: "S001",
      priority: 1,
      receivedDate: `2026-10-0${(index % 9) + 1}T00:00:00.000Z`,
    }));
    expect(selectRecentCases(many, undefined, 3)).toHaveLength(3);
  });

  it("places the linked case first regardless of its date", () => {
    const selected = selectRecentCases(
      [CASES[0], CASES[1], CASES[2]].map(toSummary),
      "D260708-00003",
      3
    );
    expect(selected[0]?.caseId).toBe("D260708-00003");
  });

  it("drops the linked-case id silently when it is not in the list", () => {
    const selected = selectRecentCases(
      [CASES[0], CASES[1]].map(toSummary),
      "UNKNOWN-CASE",
      3
    );
    expect(selected.map((item) => item.caseId)).toEqual([
      "D260708-00001",
      "D260708-00003",
    ]);
  });

  it("tolerates cases with missing receivedDate", () => {
    const withMissing: CaseSummary[] = [
      { caseId: "C-1", statusId: "S001", priority: 1, receivedDate: "" },
      { caseId: "C-2", statusId: "S001", priority: 1, receivedDate: "2026-10-02T00:00:00.000Z" },
    ];
    const selected = selectRecentCases(withMissing, undefined, 3);
    expect(selected.map((item) => item.caseId)).toEqual(["C-2", "C-1"]);
  });

  it("does not mutate the input array", () => {
    const input = [CASES[0], CASES[1], CASES[2]].map(toSummary);
    const snapshot = [...input];
    selectRecentCases(input, "D260708-00001", 2);
    expect(input).toEqual(snapshot);
  });
});

function toSummary(value: (typeof CASES)[number]): CaseSummary {
  return {
    caseId: value.caseId,
    statusId: value.statusId,
    priority: value.priority,
    receivedDate: value.receivedDate,
  };
}
