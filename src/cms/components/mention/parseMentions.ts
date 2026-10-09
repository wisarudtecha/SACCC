// A mention only counts when the "@" starts a line or follows whitespace, so the
// domain of an email address ("john@company.com") and @handle-style text pasted
// from code or chat do not parse as mentions.
const MENTION_PATTERN = /(?:^|\s)@([a-zA-Z0-9_.-]+)/g;

export function extractMentionUsernames(text: string): string[] {
  const matches = text.matchAll(MENTION_PATTERN);
  return Array.from(new Set(Array.from(matches).map((m) => m[1])));
}

export function extractMentionUserIds(
  text: string,
  userMap: Map<string, string>
): string[] {
  const usernames = extractMentionUsernames(text);
  return usernames
    .map((uname) => userMap.get(uname))
    .filter((id): id is string => Boolean(id));
}

export function parseMentionSegments(text: string): Array<
  | { type: "text"; content: string }
  | { type: "mention"; username: string }
> {
  const segments: ReturnType<typeof parseMentionSegments> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const matchIndex = match.index ?? 0;
    // "(?:^|\s)" consumes the character before "@" when the match is not at the
    // start of the text; that character belongs to the preceding text segment.
    const mentionIndex = matchIndex === 0 ? 0 : matchIndex + 1;
    if (mentionIndex > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, mentionIndex),
      });
    }
    segments.push({
      type: "mention",
      username: match[1],
    });
    // The mention spans "@" + captured username starting at mentionIndex.
    lastIndex = mentionIndex + match[1].length + 1;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}
