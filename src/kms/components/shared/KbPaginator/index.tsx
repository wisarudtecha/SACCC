interface KbPaginatorProps {
  page: number;
  totalPage: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  showingLabel?: string;
  toLabel?: string;
  ofLabel?: string;
  itemsLabel?: string;
}

const btnBase =
  "inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400";
const btnActive = "bg-amber-500 text-white shadow-sm dark:bg-amber-600";
const btnInactive =
  "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700";
const btnDisabled =
  "cursor-not-allowed opacity-40 text-gray-400 dark:text-slate-600";

const KbPaginator = ({
  page,
  totalPage,
  totalCount,
  limit,
  onPageChange,
  showingLabel = "Showing",
  toLabel = "to",
  ofLabel = "of",
  itemsLabel = "items",
}: KbPaginatorProps) => {
  const from = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalCount);
  const pages = Array.from({ length: totalPage }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-gray-400 dark:text-slate-500">
        {showingLabel}{" "}
        <span className="font-medium text-gray-600 dark:text-slate-300">
          {from}
        </span>{" "}
        {toLabel}{" "}
        <span className="font-medium text-gray-600 dark:text-slate-300">
          {to}
        </span>{" "}
        {ofLabel}{" "}
        <span className="font-medium text-gray-600 dark:text-slate-300">
          {totalCount}
        </span>{" "}
        {itemsLabel}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`${btnBase} ${page <= 1 ? btnDisabled : btnInactive}`}
          aria-label="Previous page"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {totalPage <= 7 ? (
          pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
            >
              {p}
            </button>
          ))
        ) : (
          <>
            {[1, 2].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
              >
                {p}
              </button>
            ))}
            {page > 4 && (
              <span className="px-1 text-xs text-gray-400">…</span>
            )}
            {pages
              .slice(
                Math.max(2, page - 2),
                Math.min(totalPage - 2, page + 2) + 1,
              )
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
                >
                  {p}
                </button>
              ))}
            {page < totalPage - 3 && (
              <span className="px-1 text-xs text-gray-400">…</span>
            )}
            {[totalPage - 1, totalPage].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
              >
                {p}
              </button>
            ))}
          </>
        )}

        <button
          type="button"
          disabled={page >= totalPage}
          onClick={() => onPageChange(page + 1)}
          className={`${btnBase} ${page >= totalPage ? btnDisabled : btnInactive}`}
          aria-label="Next page"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default KbPaginator;
