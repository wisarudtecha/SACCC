// /src/cms/components/admin/system-configuration/areaTemplate/AreaTemplateSyncModal.tsx
/**
 * Adopts an area template into the organization's own area data.
 *
 * Two distinct operations behind one dialog, because from the user's side they
 * are the same intent:
 *   - import: CreateOrgAreaFromTemplateCountry, for a country the org does not have yet
 *   - sync:   SyncTemplateCountry, merging a template into a country the org already has
 *
 * Only published templates are offered - a draft is still being edited, and the
 * backend locks adoption to published lineages.
 */
import React, { useEffect, useMemo, useState } from "react";
import { CloseIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  useGetTemplateCountriesQuery,
  useCreateOrgAreaFromTemplateCountryMutation,
  useSyncTemplateCountryMutation
} from "@/cms/store/api/areaTemplateApi";
import type { AreaCountryTree } from "@/cms/types/area";
import type { SyncTemplateMode, TemplateCountry } from "@/cms/types/areaTemplate";
import { isApiSuccess, resolveApiError, resolveApiMessage } from "@/cms/utils/apiResponse";
import Button from "@/core/components/ui/button/Button";
import Select from "@/core/components/form/Select";

type AdoptionMode = "import" | "sync";

// Wire values, not display copy. "replace_coodinates" is the backend's spelling -
// see SyncTemplateMode in @/cms/types/areaTemplate.
const SYNC_MODES: SyncTemplateMode[] = [
  "merge",
  "replace_all",
  "replace_label",
  "replace_coodinates"
];

interface AreaTemplateSyncModalProps {
  isOpen: boolean;
  /** The org's existing country trees - sync targets. */
  trees: AreaCountryTree[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const AreaTemplateSyncModal: React.FC<AreaTemplateSyncModalProps> = ({
  isOpen,
  trees,
  onClose,
  onSuccess,
  onError
}) => {
  const { language, t } = useTranslation();

  const { data: templateData, isLoading: isLoadingTemplates } = useGetTemplateCountriesQuery(
    undefined,
    { skip: !isOpen }
  );
  const [createFromTemplate, { isLoading: isImporting }] = useCreateOrgAreaFromTemplateCountryMutation();
  const [syncTemplate, { isLoading: isSyncing }] = useSyncTemplateCountryMutation();

  const [templateId, setTemplateId] = useState("");
  const [adoptionMode, setAdoptionMode] = useState<AdoptionMode>("import");
  const [orgCountryId, setOrgCountryId] = useState("");
  const [syncMode, setSyncMode] = useState<SyncTemplateMode>("merge");
  const [validationError, setValidationError] = useState("");

  const isSubmitting = isImporting || isSyncing;

  const publishedTemplates = useMemo(
    () => ((templateData?.data as TemplateCountry[]) || []).filter(template => template.status === "published"),
    [templateData]
  );

  const label = useMemo(
    () => (record: { en?: string; th?: string }) =>
      language === "th" && record.th || record.en || record.th || "",
    [language]
  );

  const templateOptions = useMemo(
    () => publishedTemplates.map(template => ({
      value: String(template.id),
      label: `${label(template)} (v${template.version})`
    })),
    [publishedTemplates, label]
  );

  const orgCountryOptions = useMemo(
    () => trees.map(country => ({
      value: String(country.id),
      label: `${label(country)} (${country.countryId})`
    })),
    [trees, label]
  );

  const syncModeOptions = useMemo(
    () => SYNC_MODES.map(mode => ({
      value: mode,
      label: t(`crud.areaTemplate.sync.mode.${mode}`)
    })),
    [t]
  );

  // Reopening should not inherit the previous run's selection.
  useEffect(() => {
    if (isOpen) {
      setTemplateId("");
      setAdoptionMode(trees.length > 0 ? "sync" : "import");
      setOrgCountryId(trees.length === 1 ? String(trees[0].id) : "");
      setSyncMode("merge");
      setValidationError("");
    }
  }, [isOpen, trees]);

  const handleSubmit = async () => {
    if (!templateId) {
      setValidationError(t("crud.areaTemplate.sync.error.template_required"));
      return;
    }
    if (adoptionMode === "sync" && !orgCountryId) {
      setValidationError(t("crud.areaTemplate.sync.error.country_required"));
      return;
    }
    setValidationError("");

    try {
      const response = adoptionMode === "import"
        ? await createFromTemplate({ templateCountryId: Number(templateId) }).unwrap()
        : await syncTemplate({
          id: orgCountryId,
          data: { templateCountryId: Number(templateId), mode: syncMode }
        }).unwrap();

      if (!isApiSuccess(response)) {
        throw new Error(resolveApiError(response));
      }

      onSuccess(resolveApiMessage(
        response,
        t(adoptionMode === "import"
          ? "crud.areaTemplate.sync.action.import.success"
          : "crud.areaTemplate.sync.action.sync.success")
      ));
      onClose();
    }
    catch (error) {
      onError(resolveApiError(
        error,
        t(adoptionMode === "import"
          ? "crud.areaTemplate.sync.action.import.error"
          : "crud.areaTemplate.sync.action.sync.error")
      ));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
          {t("crud.areaTemplate.sync.title")}
        </h3>
        <Button onClick={onClose} variant="ghost" size="sm">
          <CloseIcon className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 cursor-default">
        {t("crud.areaTemplate.sync.description")}
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {t("crud.areaTemplate.sync.field.template.label")}
          </label>
          <Select
            value={templateId}
            onChange={setTemplateId}
            options={templateOptions}
            placeholder={isLoadingTemplates
              ? t("crud.common.loading_records")
              : t("crud.areaTemplate.sync.field.template.placeholder")}
            className="cursor-pointer"
            disabled={isLoadingTemplates || templateOptions.length === 0}
          />
          {!isLoadingTemplates && templateOptions.length === 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("crud.areaTemplate.sync.no_published")}
            </span>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {t("crud.areaTemplate.sync.field.action.label")}
          </label>
          <Select
            value={adoptionMode}
            onChange={value => setAdoptionMode(value as AdoptionMode)}
            options={[
              { value: "import", label: t("crud.areaTemplate.sync.action.import.label") },
              { value: "sync", label: t("crud.areaTemplate.sync.action.sync.label") }
            ]}
            placeholder={t("crud.areaTemplate.sync.field.action.placeholder")}
            className="cursor-pointer"
          />
        </div>

        {adoptionMode === "sync" && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.areaTemplate.sync.field.country.label")}
              </label>
              <Select
                value={orgCountryId}
                onChange={setOrgCountryId}
                options={orgCountryOptions}
                placeholder={t("crud.areaTemplate.sync.field.country.placeholder")}
                className="cursor-pointer"
                disabled={orgCountryOptions.length === 0}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {t("crud.areaTemplate.sync.field.mode.label")}
              </label>
              <Select
                value={syncMode}
                onChange={value => setSyncMode(value as SyncTemplateMode)}
                options={syncModeOptions}
                placeholder={t("crud.areaTemplate.sync.field.mode.placeholder")}
                className="cursor-pointer"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t(`crud.areaTemplate.sync.mode_hint.${syncMode}`)}
              </span>
            </div>
          </>
        )}

        {validationError && (
          <span className="text-red-500 dark:text-red-400 text-xs">{validationError}</span>
        )}
      </div>

      <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline">
            {t("crud.common.form.action.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={isSubmitting}
            className={`${isSubmitting && "cursor-not-allowed disabled"}`}
          >
            {!isSubmitting && t("crud.area.confirm.button.confirm") || t("crud.area.confirm.button.saving")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AreaTemplateSyncModal;
