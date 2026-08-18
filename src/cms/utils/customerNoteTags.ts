// src/cms/utils/customerNoteTags.ts
/**
 * Categories ride along inside the note text as trailing hashtags:
 *
 *     "Customer wants a callback before Friday. #Billing #Support"
 *
 * The backend has no category column — a note is a single `note` string — so this
 * module is the ONLY place that knows the wire format. Cards render the decoded text
 * and show the tags as badges; the editor decodes to prefill the selector and encodes
 * again on save.
 *
 * If the backend ever grows a real category field, deleting this file and reading that
 * field instead is the whole migration.
 */
import { NOTE_CATEGORIES } from "@/cms/utils/customerNote.policy";
import type { NoteCategory } from "@/cms/types/customerNote";

export interface DecodedNote {
  /** The message with its trailing category tags removed. */
  text: string;
  /** Categories in the order they were authored, de-duplicated. */
  categories: NoteCategory[];
}

/** Lower-cased category name -> canonical casing, for case-insensitive matching. */
const CATEGORY_BY_LOWER: Map<string, NoteCategory> = new Map(
  NOTE_CATEGORIES.map(category => [category.toLowerCase(), category])
);

/**
 * A hashtag word at the very end of the string, with any whitespace in front of it.
 *
 * `[A-Za-z]+` rather than `\S+` keeps `#1042` — a reference number — from ever being
 * considered a tag, whatever its position.
 */
const TRAILING_TAG = /\s*#([A-Za-z]+)\s*$/;

const trimEnd = (value: string): string => value.replace(/\s+$/, "");

export const encodeNoteText = (text: string, categories: readonly NoteCategory[]): string => {
  const body = text.trim();

  // Preserve authored order while dropping repeats, so toggling a chip twice can't
  // produce "#Billing #Billing".
  const unique = [...new Set(categories)];
  if (unique.length === 0) {
    return body;
  }

  const tags = unique.map(category => `#${category}`).join(" ");
  return body === "" ? tags : `${body} ${tags}`;
};

/**
 * Splits a stored note back into message and categories.
 *
 * Only *trailing* tokens are considered, and only those naming a known category. Both
 * limits exist to protect the message:
 *
 *   - "Refund on invoice #1042 #Billing" keeps `#1042` in the body — a reference number
 *     mid-sentence is not a tag.
 *   - "Chase this #urgent" keeps `#urgent` visible rather than swallowing a word the
 *     user typed and cannot see anywhere in the UI.
 *
 * KNOWN LIMITATION: a message that genuinely ends with a hashed category word — say
 * "ask them about #Billing" — will have it lifted into a tag, because nothing
 * distinguishes it from an authored tag. The alternative is a separator the backend
 * would store verbatim and any other client would render as noise. Losing the visual
 * hash on an edge-case sentence is the cheaper failure; losing content is not.
 */
export const decodeNoteText = (raw: string): DecodedNote => {
  // Tags are stripped by slicing the tail off, never by tokenising the whole string.
  // Splitting on /\s+/ and re-joining would silently flatten newlines into spaces,
  // and notes are rendered `whitespace-pre-wrap` precisely so line breaks survive.
  let remainder = trimEnd(raw || "");
  const collected: NoteCategory[] = [];

  for (;;) {
    const match = remainder.match(TRAILING_TAG);
    if (!match || match.index === undefined) {
      break;
    }

    const category = CATEGORY_BY_LOWER.get(match[1].toLowerCase());
    if (!category) {
      break;
    }

    collected.push(category);
    remainder = trimEnd(remainder.slice(0, match.index));
  }

  return {
    // Walked backwards, so reverse to restore the order they were written in.
    categories: [...new Set(collected.reverse())],
    text: remainder.trim(),
  };
};
