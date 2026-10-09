import { describe, expect, it } from "vitest";
import {
  extractMentionUserIds,
  extractMentionUsernames,
  parseMentionSegments,
} from "./parseMentions";

describe("extractMentionUsernames", () => {
  it("extracts a mention at the start of the text", () => {
    expect(extractMentionUsernames("@john hello")).toEqual(["john"]);
  });

  it("extracts a mention preceded by a space", () => {
    expect(extractMentionUsernames("hi @jane")).toEqual(["jane"]);
  });

  it("extracts a mention preceded by a newline", () => {
    expect(extractMentionUsernames("line one\n@john line two")).toEqual(["john"]);
  });

  it("deduplicates repeated mentions of the same user", () => {
    expect(extractMentionUsernames("@bob and @bob again")).toEqual(["bob"]);
  });

  it("keeps usernames containing dots and hyphens", () => {
    expect(extractMentionUsernames("ping @jane.doe-e")).toEqual(["jane.doe-e"]);
  });

  it("does not extract the domain of an email address", () => {
    expect(extractMentionUsernames("mail me at john.doe@company.com")).toEqual([]);
  });

  it("does not extract an email address at the start of the text", () => {
    expect(extractMentionUsernames("john@company.com")).toEqual([]);
  });

  it("does not extract an @handle glued to preceding text", () => {
    expect(extractMentionUsernames("user@example.com and a@b")).toEqual([]);
  });

  it("still finds a real mention next to an email address", () => {
    expect(extractMentionUsernames("john@company.com cc @sarah")).toEqual(["sarah"]);
  });

  it("extracts only the first handle when two @s are glued together", () => {
    expect(extractMentionUsernames("@john@doe")).toEqual(["john"]);
  });

  it("returns an empty array for text without mentions", () => {
    expect(extractMentionUsernames("no mentions here")).toEqual([]);
    expect(extractMentionUsernames("")).toEqual([]);
  });
});

describe("extractMentionUserIds", () => {
  it("resolves usernames to ids via the user map", () => {
    const userMap = new Map([
      ["john", "id-john"],
      ["sarah", "id-sarah"],
    ]);
    expect(extractMentionUserIds("hi @john and @sarah", userMap)).toEqual([
      "id-john",
      "id-sarah",
    ]);
  });

  it("drops usernames that have no entry in the user map", () => {
    const userMap = new Map([["john", "id-john"]]);
    expect(extractMentionUserIds("hi @john and @ghost", userMap)).toEqual([
      "id-john",
    ]);
  });

  it("does not resolve email domains even if a user is named like a domain", () => {
    const userMap = new Map([["company.com", "id-domain"]]);
    expect(extractMentionUserIds("mail john@company.com", userMap)).toEqual([]);
  });

  it("returns an empty array for an empty user map", () => {
    expect(extractMentionUserIds("hi @john", new Map())).toEqual([]);
  });
});

describe("parseMentionSegments", () => {
  it("splits text around a mention at the start", () => {
    expect(parseMentionSegments("@john hello")).toEqual([
      { type: "mention", username: "john" },
      { type: "text", content: " hello" },
    ]);
  });

  it("keeps the preceding whitespace in the text segment", () => {
    expect(parseMentionSegments("hi @bob!")).toEqual([
      { type: "text", content: "hi " },
      { type: "mention", username: "bob" },
      { type: "text", content: "!" },
    ]);
  });

  it("splits multiple mentions in one text", () => {
    expect(parseMentionSegments("@alice and @bob")).toEqual([
      { type: "mention", username: "alice" },
      { type: "text", content: " and " },
      { type: "mention", username: "bob" },
    ]);
  });

  it("preserves newlines between mentions", () => {
    expect(parseMentionSegments("@alice\n@bob")).toEqual([
      { type: "mention", username: "alice" },
      { type: "text", content: "\n" },
      { type: "mention", username: "bob" },
    ]);
  });

  it("renders an email address as plain text", () => {
    expect(parseMentionSegments("mail john@company.com")).toEqual([
      { type: "text", content: "mail john@company.com" },
    ]);
  });

  it("returns a single text segment when there are no mentions", () => {
    expect(parseMentionSegments("plain text")).toEqual([
      { type: "text", content: "plain text" },
    ]);
  });

  it("round-trips segments back into the original text", () => {
    const text = "mail john@company.com — hey @jane.doe, see @bob!";
    const segments = parseMentionSegments(text);
    const reconstructed = segments
      .map((s) => (s.type === "mention" ? `@${s.username}` : s.content))
      .join("");
    expect(reconstructed).toBe(text);
  });
});
