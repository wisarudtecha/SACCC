// The REQ 2 "Try Again" control, shown next to CaseAreaSelect once the
// incident-polygon match comes back `no-match`. Modeled directly on
// StaffRouteCalculateButton's idle/solving state-to-UI mapping so the two
// "ask the backend, please wait" affordances in this app read the same way.
// The disable scope is the button itself only, per stakeholder decision - it
// does not block the rest of the form.
import { memo } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { ServiceCenterResolveStatus } from "./serviceCenterResolve";

interface ServiceCenterRetryButtonProps {
  status: ServiceCenterResolveStatus;
  isDisabled: boolean;
  onRetry: () => void;
}

function ServiceCenterRetryButtonBase({ status, isDisabled, onRetry }: ServiceCenterRetryButtonProps) {
  const { t } = useTranslation();
  const isResolving = status === "resolving";

  return (
    <div className="w-auto text-gray-900 dark:text-gray-400 mx-3">
      <button
        type="button"
        onClick={onRetry}
        disabled={isDisabled}
        aria-busy={isResolving}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5"
      >
        {isResolving ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : (
          <RotateCw className="h-3.5 w-3.5 shrink-0" />
        )}
        <span>
          {isResolving
            ? t("case.display.service_center_resolving")
            : t("case.display.service_center_retry")}
        </span>
      </button>
    </div>
  );
}

export const ServiceCenterRetryButton = memo(ServiceCenterRetryButtonBase);
ServiceCenterRetryButton.displayName = "ServiceCenterRetryButton";

export default ServiceCenterRetryButton;
