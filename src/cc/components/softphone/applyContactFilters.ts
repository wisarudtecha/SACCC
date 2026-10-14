// Pure client-side contact filter logic.
// Works against any ContactListItem array (mock or real).
import type { ContactListItem } from "./softphoneTypes";
import type { ContactFilters } from "./ContactFilterDrawer";

function includesCaseInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function applyContactFilters(
  contacts: ContactListItem[],
  filters: ContactFilters | null
): ContactListItem[] {
  if (!filters) return contacts;

  return contacts.filter((contact) => {
    if (filters.company.trim() && contact.company) {
      if (!includesCaseInsensitive(contact.company, filters.company)) {
        return false;
      }
    }

    if (filters.accountManager.trim() && contact.accountManager) {
      if (
        !includesCaseInsensitive(contact.accountManager, filters.accountManager)
      ) {
        return false;
      }
    }

    if (filters.source.trim() && contact.source) {
      if (!includesCaseInsensitive(contact.source, filters.source)) {
        return false;
      }
    }

    if (filters.tags.length > 0) {
      const hasAnyTag = filters.tags.some((tag) =>
        contact.tags?.includes(tag)
      );
      if (!hasAnyTag) return false;
    }

    if (filters.channel.length > 0) {
      const hasAnyChannel = filters.channel.some((ch) =>
        contact.channels?.includes(ch as import("./softphoneTypes").ContactChannelType)
      );
      if (!hasAnyChannel) return false;
    }

    if (filters.createdDate && contact.createdDate) {
      if (contact.createdDate !== filters.createdDate) {
        return false;
      }
    }

    return true;
  });
}
