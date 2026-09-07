// The Assignment Rules section: two single-select option groups in one form, one
// atomic Save for the whole section, one Cancel that reverts to the last-loaded
// (or schema-default) values with no network call. Owns form state and the
// save-error banner. Mirrors MapSettingsSection.tsx.
//
// Configuration only - selecting a routing or allocation method here does not
// change how any real case is assigned; no engine consumes these values yet.
import { useEffect, useMemo, useState } from "react";
import { CloseIcon } from "@/core/icons";
import Button from "@/core/components/ui/button/Button";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { OrgAssignmentRuleSettings } from "@/core/types/organization";
import { useOrgAssignmentRules } from "../useOrgAssignmentRules";
import { SmartRoutingSettings } from "./SmartRoutingSettings";
import { WorkloadAllocationSettings } from "./WorkloadAllocationSettings";

export function AssignmentRulesSection() {
  const { t } = useTranslation();
  const { loaded, isLoading, isSaving, save } = useOrgAssignmentRules();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState<OrgAssignmentRuleSettings>(loaded);
  const [saveFailed, setSaveFailed] = useState(false);

  // Re-seed the form from the loaded record: first load, and again after a
  // successful save (the query re-fetches / the mock store updates).
  useEffect(() => {
    setForm(loaded);
  }, [loaded]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(loaded),
    [form, loaded]
  );

  const handleSave = async () => {
    const result = await save({
      routingMethod: form.routingMethod,
      allocationMethod: form.allocationMethod,
    });
    if (result.ok) {
      setSaveFailed(false);
      addToast("success", "settings.assignment.action.save.success", 4000, true);
    } else {
      // Keep the admin's edits; show the persistent banner.
      setSaveFailed(true);
    }
  };

  const handleCancel = () => {
    setForm(loaded);
    setSaveFailed(false);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-40 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {saveFailed && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-100">
          <div>
            <p className="font-semibold">
              {t("settings.assignment.banner.not_saved.title")}
            </p>
            <p className="mt-0.5">{t("settings.assignment.banner.not_saved.body")}</p>
          </div>
          <button
            type="button"
            aria-label={t("settings.assignment.banner.not_saved.dismiss")}
            onClick={() => setSaveFailed(false)}
            className="shrink-0 text-yellow-700 hover:text-yellow-900 dark:text-yellow-200"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <SmartRoutingSettings
        value={form.routingMethod}
        onChange={(routingMethod) => setForm((prev) => ({ ...prev, routingMethod }))}
      />
      <WorkloadAllocationSettings
        value={form.allocationMethod}
        onChange={(allocationMethod) =>
          setForm((prev) => ({ ...prev, allocationMethod }))
        }
      />

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={handleCancel} disabled={!isDirty || isSaving}>
          {t("settings.actions.cancel")}
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? t("settings.actions.saving") : t("settings.actions.save")}
        </Button>
      </div>
    </div>
  );
}
