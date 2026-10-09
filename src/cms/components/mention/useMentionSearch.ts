import { useEffect, useState } from "react";
import { useGetUsersQuery } from "@/core/store/api/userApi";
import type { MentionUser } from "./types";

const MENTION_SEARCH_DEBOUNCE_MS = 300;
const MENTION_SEARCH_LIMIT = 8;

export function useMentionSearch(query: string, enabled: boolean) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, MENTION_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, enabled]);

  const { data, isLoading, error } = useGetUsersQuery(
    {
      search: debouncedQuery,
      length: MENTION_SEARCH_LIMIT,
    },
    { skip: !enabled || !debouncedQuery || debouncedQuery.length < 1 }
  );

  const users: MentionUser[] =
    data?.data?.map((u) => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      displayName: u.name,
      photo: u.photo,
    })) ?? [];

  return { users, isLoading, error };
}
