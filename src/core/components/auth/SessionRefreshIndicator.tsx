// /src/components/auth/SessionRefreshIndicator.tsx
import { useAuth } from "@/core/hooks/useAuth";
import { useTranslation } from "@/core/hooks/useTranslation";

/**
 * Slim, non-blocking notice shown while a background token refresh is in flight.
 *
 * Replaces the full-screen spinner that ProtectedRoute used to render *instead of* its
 * children, which unmounted the entire application on every refresh cycle and discarded
 * open modals, scroll position and unsaved form input.
 */
export const SessionRefreshIndicator = () => {
  const { state } = useAuth();
  const { t } = useTranslation();

  if (!state.isRefreshing) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-999999 flex justify-center pointer-events-none">
      <div className="mt-2 flex items-center gap-2 rounded-full bg-gray-900/85 dark:bg-gray-100/90 px-4 py-1.5 text-xs text-white dark:text-gray-900 shadow-theme-xs">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900" />
        {t("auth.signin.state.is_refreshing")}
      </div>
    </div>
  );
};
