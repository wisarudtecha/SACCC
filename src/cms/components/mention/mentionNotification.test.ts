import { describe, expect, it } from "vitest";
import type { MentionEvent } from "./mentionEvent";
import {
  buildMentionNotification,
  mentionAlertKey,
  mentionCaseDeepLink,
  MENTION_EVENT_TYPE,
} from "./mentionNotification";

function makeEvent(overrides: Partial<MentionEvent> = {}): MentionEvent {
  return {
    EVENT: "MENTION",
    orgId: "org-1",
    caseId: "CASE-1001",
    commentId: "227294",
    mentionedByUserId: "5",
    mentionedByUsername: "alice",
    mentionedByDisplayName: "Alice A",
    mentionedUserId: "9",
    mentionedUsername: "bob",
    timestamp: "2026-10-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("mentionCaseDeepLink", () => {
  it("links to the case detail page only when no commentId is given", () => {
    expect(mentionCaseDeepLink("CASE-1001")).toBe("/case/CASE-1001");
  });

  it("targets the exact comment when commentId is given", () => {
    expect(mentionCaseDeepLink("CASE-1001", "227294")).toBe(
      "/case/CASE-1001?commentId=227294"
    );
  });

  it("encodes special characters in the commentId", () => {
    expect(mentionCaseDeepLink("CASE-1001", "a b&c")).toBe(
      "/case/CASE-1001?commentId=a%20b%26c"
    );
  });
});

describe("mentionAlertKey", () => {
  it("is one alert per (commentId, mentionedUserId)", () => {
    expect(mentionAlertKey(makeEvent())).toBe("mention-227294-9");
  });

  it("distinguishes two users mentioned in the same comment", () => {
    expect(mentionAlertKey(makeEvent({ mentionedUserId: "10" }))).not.toBe(
      mentionAlertKey(makeEvent({ mentionedUserId: "11" }))
    );
  });
});

describe("buildMentionNotification", () => {
  it("maps the event onto the dropdown notification shape", () => {
    const noti = buildMentionNotification(makeEvent(), { message: "mentioned you in case CASE-1001" });

    expect(noti.id).toBe("mention-227294-9");
    expect(noti.eventType).toBe(MENTION_EVENT_TYPE);
    expect(noti.read).toBe(false);
    expect(noti.redirectURL).toBe("/case/CASE-1001?commentId=227294");
    expect(noti.message).toBe("Alice A mentioned you in case CASE-1001");
    expect(noti.data).toEqual(
      expect.arrayContaining([
        { key: "caseId", value: "CASE-1001" },
        { key: "commentId", value: "227294" },
        { key: "redirectURL", value: "/case/CASE-1001?commentId=227294" },
      ])
    );
  });

  it("falls back to username, then user id, for the sender label", () => {
    const byUsername = buildMentionNotification(
      makeEvent({ mentionedByDisplayName: "" }),
      { message: "mentioned you" }
    );
    expect(byUsername.message.startsWith("alice ")).toBe(true);

    const byId = buildMentionNotification(
      makeEvent({ mentionedByDisplayName: "", mentionedByUsername: "" }),
      { message: "mentioned you" }
    );
    expect(byId.message.startsWith("5 ")).toBe(true);
  });
});
