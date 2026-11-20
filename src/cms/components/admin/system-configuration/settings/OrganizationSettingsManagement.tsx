// Organization/System Settings page shell.
//
// WHY THIS COMPONENT HOLDS THE FORM: the backend stores the whole settings page as
// ONE JSON document (`org.config.properties` -> `{ mapSettings, assignmentRules }`),
// and a write replaces the whole value. So there is exactly one form, one dirty
// flag and one Save here; the sections below are presentational and only report
// edits. That also means switching tabs can no longer discard an edit.
//
// Adding a future settings domain is still a one-entry change: append to
// SETTINGS_SECTIONS with its label key, icon and render function. `editable: false`
// marks a section that is NOT part of the stored document, so the page-level Save
// and dirty tracking do not apply to it.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CreditCard, Map as MapIcon, Waypoints, type LucideIcon } from "lucide-react";
import { CloseIcon } from "@/core/icons";
import Button from "@/core/components/ui/button/Button";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import type {
  AssignmentModeEntry,
  OrgAssignmentRuleSettings,
  OrgConfigPropertiesDoc,
  OrgMapSettings,
} from "@/core/types/organization";
import { validateOrgMapSettings } from "@/cms/utils/orgMapSettings";
import { validateAssignmentMode } from "@/cms/utils/orgAssignmentMode";
import { applyMapSettingsToSession } from "@/cms/components/case/createCase/map/applyMapSettingsToSession";
import { AssignmentRulesSection } from "./assignment/AssignmentRulesSection";
import { MapSettingsSection, type MapSettingsSectionKey } from "./map/MapSettingsSection";
import { SubscriptionEntitlementsSection } from "./subscription/SubscriptionEntitlementsSection";
import { useOrgConfigProperties } from "./useOrgConfigProperties";

/** Locales for the "last saved" timestamp. "cn" is a region code, not a language. */
const DATE_LOCALES: Record<string, string> = { en: "en-GB", th: "th-TH", cn: "zh-CN" };

interface DocumentSectionContext {
  form: OrgConfigPropertiesDoc;
  errors: Record<string, string>;
  /** Unsaved edits exist - a section that offers a page reload must refuse while true. */
  isDirty: boolean;
  onChangeMap: <K extends MapSettingsSectionKey>(
    key: K,
    patch: Partial<OrgMapSettings[K]>
  ) => void;
  onChangeAssignment: (patch: Partial<OrgAssignmentRuleSettings>) => void;
  /** `assignmentMode[]` is a document-level array, not a field of assignmentRules. */
  onChangeAssignmentMode: (entries: AssignmentModeEntry[]) => void;
}

interface SettingsSectionDef {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  /** False = not part of the stored document (no page-level Save, no dirty state). */
  editable: boolean;
  render: (context: DocumentSectionContext) => ReactNode;
}

const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    id: "map",
    labelKey: "settings.section.map",
    icon: MapIcon,
    editable: true,
    render: ({ form, errors, isDirty, onChangeMap }) => (
      <MapSettingsSection
        value={form.mapSettings}
        errors={errors}
        isDirty={isDirty}
        onChange={onChangeMap}
      />
    ),
  },
  {
    id: "assignment-rules",
    labelKey: "settings.section.assignment_rules",
    icon: Waypoints,
    editable: true,
    render: ({ form, errors, onChangeAssignment, onChangeAssignmentMode }) => (
      <AssignmentRulesSection
        value={form.assignmentRules}
        assignmentMode={form.assignmentMode}
        errors={errors}
        onChange={onChangeAssignment}
        onAssignmentModeChange={onChangeAssignmentMode}
      />
    ),
  },
  {
    id: "subscription",
    labelKey: "settings.section.subscription",
    icon: CreditCard,
    editable: false,
    render: () => <SubscriptionEntitlementsSection />,
  },
];

interface LoadErrorBannerProps {
  message: string;
  onRetry: () => void;
}

function LoadErrorBanner({ message, onRetry }: LoadErrorBannerProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-100"
    >
      <div>
        <p className="font-semibold">{t("settings.shell.load_error.title")}</p>
        <p className="mt-0.5">{t("settings.shell.load_error.body")}</p>
        {message && <p className="mt-1 text-xs opacity-80">{message}</p>}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-lg border border-red-300 px-3 py-1 text-xs font-medium hover:bg-red-100 dark:border-red-600 dark:hover:bg-red-900/40"
      >
        {t("settings.shell.load_error.retry")}
      </button>
    </div>
  );
}

function NotSavedYetBanner() {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-100">
      <p className="font-semibold">{t("settings.shell.not_saved_yet.title")}</p>
      <p className="mt-0.5">{t("settings.shell.not_saved_yet.body")}</p>
    </div>
  );
}

interface SaveFailedBannerProps {
  message: string;
  onDismiss: () => void;
}

function SaveFailedBanner({ message, onDismiss }: SaveFailedBannerProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-100">
      <div>
        <p className="font-semibold">{t("settings.shell.save_failed.title")}</p>
        <p className="mt-0.5">{t("settings.shell.save_failed.body")}</p>
        {message && <p className="mt-1 text-xs opacity-80">{message}</p>}
      </div>
      <button
        type="button"
        aria-label={t("settings.shell.save_failed.dismiss")}
        onClick={onDismiss}
        className="shrink-0 text-yellow-700 hover:text-yellow-900 dark:text-yellow-200"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function OrganizationSettingsManagement() {
  const { t, language } = useTranslation();
  const { loaded, loadState, loadError, isSaving, save, reload, savedMeta } =
    useOrgConfigProperties({ refetchOnMount: true });
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState<OrgConfigPropertiesDoc>(loaded);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [activeId, setActiveId] = useState(SETTINGS_SECTIONS[0]?.id ?? "");
  const [hasSettledOnce, setHasSettledOnce] = useState(false);

  // The placeholder below is for the FIRST load only. A later refetch (every Save
  // invalidates the tag) must not unmount the form: that would throw away the
  // admin's edits, the validation errors and the open disclosures.
  useEffect(() => {
    if (loadState !== "loading") {
      setHasSettledOnce(true);
    }
  }, [loadState]);

  // Re-seed from the stored document: first load, and again after a successful save.
  useEffect(() => {
    setForm(loaded);
    setErrors({});
  }, [loaded]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(loaded);

  // One Save for the whole page means leaving the page silently loses everything,
  // so warn on unload. The message is read through a ref: `t` is rebuilt on every
  // render and must never be an effect dependency.
  const unloadWarningRef = useRef("");
  unloadWarningRef.current = t("settings.shell.unload_warning");
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = unloadWarningRef.current;
      return unloadWarningRef.current;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const active = SETTINGS_SECTIONS.find((section) => section.id === activeId) ?? SETTINGS_SECTIONS[0];

  const handleMapChange = <K extends MapSettingsSectionKey>(
    key: K,
    patch: Partial<OrgMapSettings[K]>
  ) => {
    setForm((previous) => ({
      ...previous,
      mapSettings: {
        ...previous.mapSettings,
        [key]: { ...previous.mapSettings[key], ...patch },
      },
    }));
  };

  const handleAssignmentChange = (patch: Partial<OrgAssignmentRuleSettings>) => {
    setForm((previous) => ({
      ...previous,
      assignmentRules: { ...previous.assignmentRules, ...patch },
    }));
  };

  const handleAssignmentModeChange = (entries: AssignmentModeEntry[]) => {
    setForm((previous) => ({ ...previous, assignmentMode: entries }));
  };

  // A save must never run on a document we could not read: `loaded` would be schema
  // defaults, and writing them over the stored settings would destroy real values.
  const canSave = loadState !== "error" && !isSaving;

  const handleSave = async () => {
    // All three parts of the document travel in one Save, so all are checked here.
    // The assignment-mode rule is the one that replaced the retired
    // `assignmentRules.mode` check: a sub-type staged as "auto" in an organisation
    // with no routing criterion claims the system will route and defines no way to.
    const mapErrors = validateOrgMapSettings(form.mapSettings);
    const assignmentErrors = validateAssignmentMode(
      form.assignmentMode,
      form.assignmentRules.routingModes
    );
    const nextErrors = { ...mapErrors, ...assignmentErrors };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // Show the failing section instead of leaving Save looking inert on whichever
      // tab happens to be open. Map first: it is the tab the page opens on.
      setActiveId(Object.keys(mapErrors).length > 0 ? "map" : "assignment-rules");
      return;
    }

    const result = await save(form);
    if (result.ok) {
      setSaveErrorMessage(null);
      addToast("success", "settings.shell.save.success", 4000, true);
      // MOST SETTINGS APPLY ON THEIR OWN: the save invalidates the OrgSettings tag,
      // so every `useOrgMapSettings` consumer refetches. The three knobs that live
      // in `mapRuntimeConfig` (provider, style switcher, default basemap) resolve
      // once per session, so they are applied here - otherwise an admin would have
      // to reload the page to see the provider they just chose.
      const savedMapSettings = result.doc?.mapSettings ?? form.mapSettings;
      const applied = applyMapSettingsToSession(savedMapSettings, savedMapSettings.orgId || form.orgId);
      if (applied === "deferred") {
        // A map was on screen, so the session keeps its provider. Rare (this page
        // mounts no map); the settings panel also shows a note and a reload button.
        addToast("warning", "settings.shell.map_apply_deferred", 6000, true);
      }
      return;
    }
    setSaveErrorMessage(result.message ?? "");
  };

  const handleCancel = () => {
    setForm(loaded);
    setErrors({});
    setSaveErrorMessage(null);
  };

  const savedAt = savedMeta.updatedAt ? new Date(savedMeta.updatedAt) : null;
  const savedMetaLabel =
    savedAt && !Number.isNaN(savedAt.getTime())
      ? t("settings.shell.last_saved", {
          by: savedMeta.updatedBy || t("settings.shell.last_saved_unknown_user"),
          at: savedAt.toLocaleString(DATE_LOCALES[language] ?? undefined),
        })
      : "";

  if (loadState === "loading" && !hasSettledOnce) {
    return (
      <div className="animate-pulse space-y-4">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-40 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/2"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <nav className="flex gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = section.id === active?.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveId(section.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/3"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-start">{t(section.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {loadState === "error" && <LoadErrorBanner message={loadError} onRetry={reload} />}
        {loadState === "empty" && <NotSavedYetBanner />}
        {saveErrorMessage !== null && (
          <SaveFailedBanner message={saveErrorMessage} onDismiss={() => setSaveErrorMessage(null)} />
        )}

        {active?.render({
          form,
          errors,
          isDirty,
          onChangeMap: handleMapChange,
          onChangeAssignment: handleAssignmentChange,
          onChangeAssignmentMode: handleAssignmentModeChange,
        })}

        {active?.editable && (
          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5 text-xs text-gray-500 dark:text-gray-400">
              {isDirty && (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {t("settings.shell.dirty")}
                </span>
              )}
              {savedMetaLabel && <span>{savedMetaLabel}</span>}
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={!isDirty || isSaving}>
                {t("settings.actions.cancel")}
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!canSave}>
                {isSaving ? t("settings.actions.saving") : t("settings.actions.save")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
