import { describe, expect, it } from "vitest";
import { applyContactFilters } from "./applyContactFilters";
import type { ContactListItem } from "./softphoneTypes";
import type { ContactFilters } from "./ContactFilterDrawer";

const fixtures: ContactListItem[] = [
  {
    id: "c1",
    name: "John Smith",
    phone: "+66 81-234-5678",
    email: "john.smith@abc.com",
    company: "ABC Corporation",
    tags: ["VIP"],
    channels: ["PHONE", "EMAIL"],
    accountManager: "Alice Manager",
    source: "Referral",
    createdDate: "2024-01-15",
  },
  {
    id: "c2",
    name: "Sarah Johnson",
    phone: "+66 82-345-6789",
    email: "sarah.j@xyz.com",
    company: "XYZ Ltd",
    tags: ["Enterprise"],
    channels: ["PHONE", "LINE"],
    accountManager: "Bob Manager",
    source: "Website",
    createdDate: "2024-03-22",
  },
  {
    id: "c3",
    name: "Michael Chen",
    phone: "+66 83-456-7890",
    email: "m.chen@tech.com",
    company: "Tech Innovations",
    tags: ["VIP"],
    channels: ["PHONE", "EMAIL", "LINE"],
    accountManager: "Alice Manager",
    source: "Event",
    createdDate: "2024-06-10",
  },
];

describe("applyContactFilters", () => {
  it("returns all contacts when filters is null", () => {
    expect(applyContactFilters(fixtures, null)).toEqual(fixtures);
  });

  it("filters by company (case-insensitive substring)", () => {
    const filters: ContactFilters = {
      channel: [],
      company: "abc",
      accountManager: "",
      tags: [],
      source: "",
      createdDate: "",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual([fixtures[0]]);
  });

  it("filters by accountManager (case-insensitive substring)", () => {
    const filters: ContactFilters = {
      channel: [],
      company: "",
      accountManager: "alice",
      tags: [],
      source: "",
      createdDate: "",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual([
      fixtures[0],
      fixtures[2],
    ]);
  });

  it("filters by source (case-insensitive substring)", () => {
    const filters: ContactFilters = {
      channel: [],
      company: "",
      accountManager: "",
      tags: [],
      source: "website",
      createdDate: "",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual([fixtures[1]]);
  });

  it("filters by tags (OR semantics)", () => {
    const filters: ContactFilters = {
      channel: [],
      company: "",
      accountManager: "",
      tags: ["Enterprise"],
      source: "",
      createdDate: "",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual([fixtures[1]]);
  });

  it("filters by multiple tags (OR semantics)", () => {
    const filters: ContactFilters = {
      channel: [],
      company: "",
      accountManager: "",
      tags: ["Enterprise", "VIP"],
      source: "",
      createdDate: "",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual(fixtures);
  });

  it("excludes contacts with no matching tags", () => {
    const filters: ContactFilters = {
      channel: [],
      company: "",
      accountManager: "",
      tags: ["New"],
      source: "",
      createdDate: "",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual([]);
  });

  it("filters by channel (OR semantics)", () => {
    const filters: ContactFilters = {
      channel: ["LINE"],
      company: "",
      accountManager: "",
      tags: [],
      source: "",
      createdDate: "",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual([
      fixtures[1],
      fixtures[2],
    ]);
  });

  it("filters by createdDate (exact match)", () => {
    const filters: ContactFilters = {
      channel: [],
      company: "",
      accountManager: "",
      tags: [],
      source: "",
      createdDate: "2024-03-22",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual([fixtures[1]]);
  });

  it("combines multiple filters (AND semantics across fields)", () => {
    const filters: ContactFilters = {
      channel: ["EMAIL"],
      company: "abc",
      accountManager: "",
      tags: ["VIP"],
      source: "",
      createdDate: "",
    };
    expect(applyContactFilters(fixtures, filters)).toEqual([fixtures[0]]);
  });

  it("does not mutate the input array", () => {
    const filters: ContactFilters = {
      channel: [],
      company: "nonexistent",
      accountManager: "",
      tags: [],
      source: "",
      createdDate: "",
    };
    const before = fixtures.slice();
    applyContactFilters(fixtures, filters);
    expect(fixtures).toEqual(before);
  });
});
