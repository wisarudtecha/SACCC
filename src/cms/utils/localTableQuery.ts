// src/cms/utils/localTableQuery.ts
/**
 * Client-side search + paging for the generic View component.
 *
 * The AreaTemplate list operations take no pagination or search arguments -
 * GetListTemplateCountry has no GraphQL input at all - so the whole set comes
 * back in one call and the browser does the filtering. BrandView and StoreView
 * already work this way for the same reason; this just stops each view
 * re-implementing the slice.
 */

export interface LocalTableQuery {
  start: number;
  length: number;
  search?: string;
  [key: string]: unknown;
}

export const INITIAL_LOCAL_QUERY: LocalTableQuery = {
  start: 0,
  length: 10,
  search: ""
};

export interface LocalTableResult<T> {
  /** The rows for the page View is currently showing. */
  rows: T[];
  /** Rows remaining after search - what View needs for its page count. */
  filteredCount: number;
  /** Rows before search. */
  totalCount: number;
}

/**
 * @param searchableText fields of a row that search should match against;
 *                       undefined/null entries are ignored.
 */
export const applyLocalTableQuery = <T>(
  rows: T[],
  query: LocalTableQuery,
  searchableText: (row: T) => (string | number | null | undefined)[]
): LocalTableResult<T> => {
  const all = rows || [];
  const needle = String(query.search || "").trim().toLowerCase();

  const filtered = needle
    ? all.filter(row => searchableText(row).some(
      value => value !== null && value !== undefined && String(value).toLowerCase().includes(needle)
    ))
    : all;

  const start = Number(query.start) || 0;
  const length = Number(query.length) || INITIAL_LOCAL_QUERY.length;

  return {
    rows: filtered.slice(start, start + length),
    filteredCount: filtered.length,
    totalCount: all.length
  };
};
