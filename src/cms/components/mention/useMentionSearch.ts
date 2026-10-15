import { useEffect, useMemo, useState } from "react";
import { useGetUsersQuery } from "@/core/store/api/userApi";
import type { MentionUser } from "./types";

const MENTION_SEARCH_DEBOUNCE_MS = 3000;
const MENTION_SEARCH_MIN_CHARS = 3;
const MENTION_SEARCH_LIMIT = 8;
const MENTION_BULK_FETCH_LENGTH = 10000;

export function useMentionSearch(query: string, enabled: boolean) {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (!enabled) {
      setDebouncedQuery("");
      return;
    }

    if (query.length < MENTION_SEARCH_MIN_CHARS) {
      setDebouncedQuery("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, MENTION_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, enabled]);

  const { data, isLoading, error } = useGetUsersQuery(
    {
      length: MENTION_BULK_FETCH_LENGTH,
    },
    { skip: !enabled }
  );

  const allUsers: MentionUser[] = useMemo(
    () =>
      data?.data?.map((u) => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        displayName: u.name,
        photo: u.photo,
      })) ?? [],
    [data]
  );

  const users = useMemo(() => {
    if (debouncedQuery.length < MENTION_SEARCH_MIN_CHARS) {
      return [];
    }

    const lowerQuery = debouncedQuery.toLowerCase();
    const filtered = allUsers.filter((user) => {
      const searchable = [
        user.username,
        user.firstName,
        user.lastName,
        user.displayName,
      ]
        .filter((s): s is string => Boolean(s))
        .map((s) => s.toLowerCase());

      return searchable.some((field) => field.includes(lowerQuery));
    });

    return filtered.slice(0, MENTION_SEARCH_LIMIT);
  }, [debouncedQuery, allUsers]);

  const isTyping =
    enabled && query.length > 0 && query !== debouncedQuery;

  return { users, isLoading, isTyping, error };
}
