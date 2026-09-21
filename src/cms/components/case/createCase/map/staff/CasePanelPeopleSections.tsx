// The two people lists in the Case Panel: who assigned units to the case, and
// who was assigned.
//
// Both are lists, never a single row - a case can have several of each.
import { memo } from "react";
import { LocateFixed } from "lucide-react";
import type { CaseStatusInterface } from "@/cms/components/ui/status/status";
import type { CaseSopUnit } from "@/cms/types/dispatch";
import type { Language } from "@/core/config/i18n";
import { useTranslation } from "@/core/hooks/useTranslation";
import { canFocusResponder, getResponderLabel, resolveUserLabel } from "./casePanelModel";
import { getCaseStatusName } from "./staffDisplay";
import type { StaffMarker } from "./staffTypes";

interface PeopleSectionProps {
  title: string;
  children: React.ReactNode;
}

function PeopleSection({ title, children }: PeopleSectionProps) {
  return (
    <section className="border-b border-gray-200 p-3 dark:border-gray-700">
      <h4 className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">{title}</h4>
      {children}
    </section>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-[11px] text-gray-400 dark:text-gray-500">{text}</p>;
}

interface CaseDispatcherListProps {
  /** Assigner usernames, already de-duplicated - see dedupeDispatchers. */
  usernames: readonly string[];
  userNameIndex: ReadonlyMap<string, string>;
}

function CaseDispatcherListBase({ usernames, userNameIndex }: CaseDispatcherListProps) {
  const { t } = useTranslation();

  return (
    <PeopleSection title={t("case.display.map_case_dispatchers")}>
      {usernames.length === 0 ? (
        <EmptyNote text={t("case.display.map_case_dispatchers_empty")} />
      ) : (
        <ul className="space-y-1">
          {usernames.map((username) => (
            <li key={username} className="truncate text-xs text-gray-900 dark:text-white">
              {resolveUserLabel(username, userNameIndex)}
            </li>
          ))}
        </ul>
      )}
    </PeopleSection>
  );
}

export const CaseDispatcherList = memo(CaseDispatcherListBase);
CaseDispatcherList.displayName = "CaseDispatcherList";

interface CaseResponderListProps {
  units: readonly CaseSopUnit[];
  staff: readonly StaffMarker[];
  /** True once the staff list has loaded - decides whether a missing marker means "no position". */
  isStaffLoaded: boolean;
  caseStatuses: readonly CaseStatusInterface[];
  language: Language;
  /** The unit currently open in the Staff Panel, highlighted in the list. */
  selectedUnitId: string | null;
  onFocusResponder: (unitId: string) => void;
}

function CaseResponderListBase({
  units,
  staff,
  isStaffLoaded,
  caseStatuses,
  language,
  selectedUnitId,
  onFocusResponder
}: CaseResponderListProps) {
  const { t } = useTranslation();

  return (
    <PeopleSection title={t("case.display.map_case_responders")}>
      {units.length === 0 ? (
        <EmptyNote text={t("case.display.map_case_responders_empty")} />
      ) : (
        <ul className="space-y-1.5">
          {units.map((unit) => {
            const canFocus = canFocusResponder(unit.unitId, staff, isStaffLoaded);
            const isSelected = unit.unitId === selectedUnitId;
            const focusLabel = canFocus
              ? t("case.display.map_case_focus_responder")
              : t("case.display.map_case_focus_unavailable");
            return (
              <li
                key={unit.unitId}
                className={`flex items-center gap-2 rounded px-2 py-1 ${
                  isSelected ? "bg-blue-50 dark:bg-blue-500/[.13]" : "bg-gray-50 dark:bg-white/5"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                    {getResponderLabel(unit)}
                  </p>
                  <p className="truncate text-[11px] text-blue-600 dark:text-blue-300">
                    {getCaseStatusName(caseStatuses, unit.statusId, language)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canFocus}
                  onClick={() => onFocusResponder(unit.unitId)}
                  title={focusLabel}
                  aria-label={focusLabel}
                  className="shrink-0 rounded p-1 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                >
                  <LocateFixed className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PeopleSection>
  );
}

export const CaseResponderList = memo(CaseResponderListBase);
CaseResponderList.displayName = "CaseResponderList";
