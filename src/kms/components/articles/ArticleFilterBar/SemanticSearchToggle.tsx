// Semantic-search mode selector for the KB articles filter.
//
// Semantic/similarity search is an Enterprise add-on
// ("entitlement.kb.semantic_search"). Unentitled tenants see the mode with a
// lock and get the upgrade prompt on click; entitled (Enterprise) tenants see
// it disabled with a "coming soon" badge because the backend endpoint does not
// exist yet — when it lands, the entitled branch should switch the article
// list from useArticleListData (keyword) to the semantic query hook.
import { Lock } from "lucide-react";
import { useUpgradePrompt } from "@/core/components/entitlements/useUpgradePrompt";
import { useEntitlements } from "@/core/hooks/useEntitlements";
import { useTranslation } from "@/core/hooks/useTranslation";

const FEATURE = "entitlement.kb.semantic_search" as const;

export function SemanticSearchToggle() {
  const { t } = useTranslation();
  const { isLoading, isLocked } = useEntitlements();
  const { promptFor, modal } = useUpgradePrompt();

  // Neutral while entitlements load — same rule as the sidebar badges.
  if (isLoading) return null;

  const locked = isLocked(FEATURE);

  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs">
      <span className="text-gray-500 dark:text-gray-400">
        {t("knowledge.search.mode")}
      </span>
      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        {t("knowledge.search.keyword")}
      </span>
      <button
        type="button"
        onClick={locked ? () => promptFor(FEATURE) : undefined}
        disabled={!locked}
        title={locked ? undefined : t("knowledge.search.semantic_coming_soon")}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
          locked
            ? "cursor-pointer bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-400 dark:hover:bg-white/[0.1]"
            : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-white/[0.04] dark:text-gray-500"
        }`}
      >
        {locked && <Lock className="h-3 w-3" />}
        {t("knowledge.search.semantic")}
        {!locked && (
          <span className="rounded-full bg-gray-200 px-1.5 text-[10px] leading-4 text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">
            {t("knowledge.search.semantic_coming_soon")}
          </span>
        )}
      </button>
      {modal}
    </div>
  );
}
