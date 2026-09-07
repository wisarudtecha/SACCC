// The Map Settings section: five field groups in one form, one atomic Save for
// the whole section, one Cancel that reverts to the last-loaded (or schema-
// default) values with no network call. Owns form state, validation, the save-
// error banner, and the Staff "Advanced" disclosure open state.
import { useEffect, useMemo, useState } from "react";
import { CloseIcon } from "@/core/icons";
import Button from "@/core/components/ui/button/Button";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import type {
  OrgMapSettings,
  OrgMapSettingsUpdateData,
} from "@/core/types/organization";
import { validateOrgMapSettings } from "@/cms/utils/orgMapSettings";
import { useOrgMapSettings } from "../useOrgMapSettings";
import { AssignmentMapSettings } from "./AssignmentMapSettings";
import { GeneralMapSettings } from "./GeneralMapSettings";
import { IncidentMapSettings } from "./IncidentMapSettings";
import { LayerMapSettings } from "./LayerMapSettings";
import { StaffMapSettings } from "./StaffMapSettings";

type SectionKey = keyof Omit<OrgMapSettings, "orgId" | "updatedAt" | "updatedBy">;

function toUpdateData(form: OrgMapSettings): OrgMapSettingsUpdateData {
  return {
    general: form.general,
    layers: form.layers,
    incident: form.incident,
    staff: form.staff,
    assignment: form.assignment,
  };
}

export function MapSettingsSection() {
  const { t } = useTranslation();
  const { loaded, isLoading, isSaving, save } = useOrgMapSettings();
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState<OrgMapSettings>(loaded);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveFailed, setSaveFailed] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Re-seed the form from the loaded record: first load, and again after a
  // successful save (the query re-fetches / the mock store updates). This is the
  // "changes take effect on next load" behaviour - deliberately no live merge.
  useEffect(() => {
    setForm(loaded);
    setErrors({});
  }, [loaded]);

  const updateSection = <K extends SectionKey>(
    key: K,
    patch: Partial<OrgMapSettings[K]>
  ) => {
    setForm(
      (prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }) as OrgMapSettings
    );
  };

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(loaded),
    [form, loaded]
  );

  const handleSave = async () => {
    const nextErrors = validateOrgMapSettings(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // No network call. Open the disclosure if a hidden interval is the problem.
      if (
        Object.keys(nextErrors).some((key) => key.startsWith("staff.")) &&
        !advancedOpen
      ) {
        setAdvancedOpen(true);
      }
      return;
    }

    const result = await save(toUpdateData(form));
    if (result.ok) {
      setSaveFailed(false);
      addToast("success", "settings.map.action.save.success", 4000, true);
    } else {
      // Keep the admin's edits; show the persistent banner.
      setSaveFailed(true);
    }
  };

  const handleCancel = () => {
    setForm(loaded);
    setErrors({});
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
            <p className="font-semibold">{t("settings.map.banner.not_saved.title")}</p>
            <p className="mt-0.5">{t("settings.map.banner.not_saved.body")}</p>
          </div>
          <button
            type="button"
            aria-label={t("settings.map.banner.not_saved.dismiss")}
            onClick={() => setSaveFailed(false)}
            className="shrink-0 text-yellow-700 hover:text-yellow-900 dark:text-yellow-200"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <GeneralMapSettings
        value={form.general}
        onChange={(patch) => updateSection("general", patch)}
      />
      <LayerMapSettings
        value={form.layers}
        onChange={(patch) => updateSection("layers", patch)}
      />
      <IncidentMapSettings
        value={form.incident}
        onChange={(patch) => updateSection("incident", patch)}
        errors={errors}
      />
      <StaffMapSettings
        value={form.staff}
        onChange={(patch) => updateSection("staff", patch)}
        errors={errors}
        advancedOpen={advancedOpen}
        onAdvancedOpenChange={setAdvancedOpen}
      />
      <AssignmentMapSettings
        value={form.assignment}
        onChange={(patch) => updateSection("assignment", patch)}
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
