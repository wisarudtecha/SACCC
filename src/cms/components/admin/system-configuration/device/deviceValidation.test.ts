// Unit tests for the Device Management form validators.
// Run: `pnpm test` (Vitest, node environment).
import { describe, it, expect } from "vitest";
import {
  LAT_MIN, LAT_MAX, LON_MIN, LON_MAX,
  isValidCoordinate, isValidIpv4, isValidMacAddress
} from "./deviceValidation";

describe("isValidCoordinate", () => {
  it("accepts an in-range numeric string", () => {
    expect(isValidCoordinate("13.7563", LAT_MIN, LAT_MAX)).toBe(true);
    expect(isValidCoordinate("100.5018", LON_MIN, LON_MAX)).toBe(true);
    expect(isValidCoordinate("0", LAT_MIN, LAT_MAX)).toBe(true);
    expect(isValidCoordinate("-90", LAT_MIN, LAT_MAX)).toBe(true);
  });

  it("rejects empty, non-numeric, or out-of-range", () => {
    expect(isValidCoordinate("", LAT_MIN, LAT_MAX)).toBe(false);
    expect(isValidCoordinate("   ", LAT_MIN, LAT_MAX)).toBe(false);
    expect(isValidCoordinate("abc", LAT_MIN, LAT_MAX)).toBe(false);
    expect(isValidCoordinate("91", LAT_MIN, LAT_MAX)).toBe(false);
    expect(isValidCoordinate("-181", LON_MIN, LON_MAX)).toBe(false);
  });
});

describe("isValidIpv4", () => {
  it("accepts a dotted quad with each octet 0-255", () => {
    expect(isValidIpv4("10.0.0.1")).toBe(true);
    expect(isValidIpv4("255.255.255.255")).toBe(true);
    expect(isValidIpv4("0.0.0.0")).toBe(true);
  });

  it("rejects wrong shape, out-of-range octets, or leading zeroes", () => {
    expect(isValidIpv4("10.0.0")).toBe(false);
    expect(isValidIpv4("10.0.0.1.1")).toBe(false);
    expect(isValidIpv4("256.0.0.1")).toBe(false);
    expect(isValidIpv4("10.0.0.01")).toBe(false);
    expect(isValidIpv4("10.0.0.-1")).toBe(false);
    expect(isValidIpv4("ten.0.0.1")).toBe(false);
    expect(isValidIpv4("")).toBe(false);
  });
});

describe("isValidMacAddress", () => {
  it("accepts six hex pairs with a consistent : or - separator", () => {
    expect(isValidMacAddress("AA:BB:CC:DD:EE:FF")).toBe(true);
    expect(isValidMacAddress("aa-bb-cc-dd-ee-ff")).toBe(true);
    expect(isValidMacAddress("01:23:45:67:89:ab")).toBe(true);
  });

  it("rejects wrong length, mixed separators, or non-hex", () => {
    expect(isValidMacAddress("AA:BB:CC:DD:EE")).toBe(false);
    expect(isValidMacAddress("AA:BB:CC:DD:EE:FF:00")).toBe(false);
    expect(isValidMacAddress("AA:BB-CC:DD:EE:FF")).toBe(false);
    expect(isValidMacAddress("AABBCCDDEEFF")).toBe(false);
    expect(isValidMacAddress("GG:BB:CC:DD:EE:FF")).toBe(false);
    expect(isValidMacAddress("")).toBe(false);
  });
});
