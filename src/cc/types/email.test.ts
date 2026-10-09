// Tests for email shape guards and extractors — FE-10.
//
// Written for Vitest; `*.test.ts` is excluded from `tsconfig.app.json`.
import { describe, it, expect } from "vitest";
import {
  extractEmailInbox,
  extractEmailMessage,
  isEmailInboxItem,
  isEmailMessage,
} from "./email";

const validAttachment = {
  id: "a1",
  filename: "doc.pdf",
  url: "https://example.com/doc.pdf",
  size: 1024,
  mimeType: "application/pdf",
};

const validInboxItem = {
  id: "1",
  from: "sender@example.com",
  fromName: "Sender",
  subject: "Hello",
  preview: "World",
  time: "10:00 AM",
  unread: true,
  folder: "inbox",
  attachmentCount: 1,
};

const validMessage = {
  id: "1",
  from: "sender@example.com",
  fromName: "Sender",
  to: ["recipient@example.com"],
  cc: [],
  bcc: [],
  subject: "Hello",
  body: "World",
  time: "10:00 AM",
  unread: true,
  folder: "inbox",
  attachments: [validAttachment],
};

describe("extractEmailInbox", () => {
  it("returns the inbox response for a valid envelope", () => {
    const envelope = { status: "0", msg: "ok", data: { threads: [validInboxItem] } };
    const result = extractEmailInbox(envelope);
    expect(result).toEqual({ threads: [validInboxItem] });
  });

  it("returns null when data is a truthy-but-empty array", () => {
    // normalizeToApiResponse coerces absent data to [] — this must not pass as valid
    const envelope = { status: "0", msg: "ok", data: [] };
    const result = extractEmailInbox(envelope);
    expect(result).toBeNull();
  });

  it("returns null for a malformed payload", () => {
    const envelope = { status: "0", msg: "ok", data: { threads: [{ id: 123 }] } };
    const result = extractEmailInbox(envelope);
    expect(result).toBeNull();
  });

  it("returns null when data is null", () => {
    const envelope = { status: "0", msg: "ok", data: null };
    const result = extractEmailInbox(envelope);
    expect(result).toBeNull();
  });

  it("returns null when data is missing", () => {
    const envelope = { status: "0", msg: "ok" };
    const result = extractEmailInbox(envelope);
    expect(result).toBeNull();
  });

  it("returns null when the envelope itself is null", () => {
    expect(extractEmailInbox(null)).toBeNull();
    expect(extractEmailInbox(undefined)).toBeNull();
  });
});

describe("extractEmailMessage", () => {
  it("returns the message for a valid envelope", () => {
    const envelope = { status: "0", msg: "ok", data: validMessage };
    const result = extractEmailMessage(envelope);
    expect(result).toEqual(validMessage);
  });

  it("returns null when data is a truthy-but-empty array", () => {
    const envelope = { status: "0", msg: "ok", data: [] };
    const result = extractEmailMessage(envelope);
    expect(result).toBeNull();
  });

  it("returns null for a malformed payload missing required fields", () => {
    const envelope = { status: "0", msg: "ok", data: { id: "1", subject: "Hello" } };
    const result = extractEmailMessage(envelope);
    expect(result).toBeNull();
  });

  it("returns null when data is null", () => {
    const envelope = { status: "0", msg: "ok", data: null };
    const result = extractEmailMessage(envelope);
    expect(result).toBeNull();
  });

  it("returns null when data is missing", () => {
    const envelope = { status: "0", msg: "ok" };
    const result = extractEmailMessage(envelope);
    expect(result).toBeNull();
  });

  it("returns null when the envelope itself is null", () => {
    expect(extractEmailMessage(null)).toBeNull();
    expect(extractEmailMessage(undefined)).toBeNull();
  });
});

describe("isEmailInboxItem", () => {
  it("returns true for a valid inbox item", () => {
    expect(isEmailInboxItem(validInboxItem)).toBe(true);
  });

  it("returns false when a required string field is missing", () => {
    expect(isEmailInboxItem({ ...validInboxItem, subject: undefined })).toBe(false);
  });

  it("returns false when unread is not a boolean", () => {
    expect(isEmailInboxItem({ ...validInboxItem, unread: "true" })).toBe(false);
  });

  it("returns false when folder is not a valid EmailTab", () => {
    expect(isEmailInboxItem({ ...validInboxItem, folder: "spam" })).toBe(false);
  });
});

describe("isEmailMessage", () => {
  it("returns true for a valid message", () => {
    expect(isEmailMessage(validMessage)).toBe(true);
  });

  it("returns false when to is not a string array", () => {
    expect(isEmailMessage({ ...validMessage, to: [1, 2] })).toBe(false);
  });

  it("returns false when attachments contain an invalid entry", () => {
    const badAttachment = { ...validAttachment, size: "large" };
    expect(isEmailMessage({ ...validMessage, attachments: [badAttachment] })).toBe(false);
  });
});
