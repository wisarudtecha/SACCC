// The Case Panel's people list: everyone assigned to the case, and who assigned
// them.
//
// One merged list rather than two - a dispatcher-per-assignment (CaseSopUnit's
// `createdBy`) reads naturally as an attribute of the responder they assigned,
// not as its own roster.
import { memo } from "react";
import { LocateFixed } from "lucide-react";
import type { CaseStatusInterface } from "@/cms/components/ui/status/status";
import type { CaseSopUnit } from "@/cms/types/dispatch";
import type { Language } from "@/core/config/i18n";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  canFocusResponder,
  getResponderLabel,
  resolveUserLabel,
  resolveUserPhoto,
  type UserInfo
} from "./casePanelModel";
import PersonAvatar from "./PersonAvatar";
import { getCaseStatusName } from "./staffDisplay";
import type { StaffMarker } from "./staffTypes";

function EmptyNote({ text }: { text: string }) {
  return <p className="text-[11px] text-gray-400 dark:text-gray-500">{text}</p>;
}

interface CaseResponderListProps {
  units: readonly CaseSopUnit[];
  staff: readonly StaffMarker[];
  /** True once the staff list has loaded - decides whether a missing marker means "no position". */
  isStaffLoaded: boolean;
  caseStatuses: readonly CaseStatusInterface[];
  language: Language;
  /** username -> assigner's name/photo - see casePanelModel.buildUserInfoIndex. */
  userInfoIndex: ReadonlyMap<string, UserInfo>;
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
  userInfoIndex,
  selectedUnitId,
  onFocusResponder
}: CaseResponderListProps) {
  const { t } = useTranslation();

  return (
    <section className="border-b border-gray-200 p-3 dark:border-gray-700">
      <h4 className="mb-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {t("case.display.map_case_responders")}
      </h4>
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
            const responderPhoto = staff.find((marker) => marker.unitId === unit.unitId)?.photo;
            const dispatcherUsername = unit.createdBy?.trim();

            return (
              <li key={unit.unitId}>
                {/* The whole row is the "focus" action - name, avatar and status
                    included, not a separate icon-only button beside them - so
                    clicking the responder's name does the same thing the icon
                    used to do alone. The icon stays as a visual cue only. */}
                <button
                  type="button"
                  disabled={!canFocus}
                  onClick={() => onFocusResponder(unit.unitId)}
                  title={focusLabel}
                  aria-label={`${getResponderLabel(unit)}: ${focusLabel}`}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-500/[.13]"
                      : "bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
                  }`}
                >
                  <PersonAvatar name={getResponderLabel(unit)} photo={responderPhoto} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                      {getResponderLabel(unit)}
                    </p>
                    <p className="truncate text-[11px] text-blue-600 dark:text-blue-300">
                      {getCaseStatusName(caseStatuses, unit.statusId, language)}
                    </p>
                    {dispatcherUsername && (
                      <div className="mt-0.5 flex min-w-0 items-center gap-1">
                        <PersonAvatar
                          name={resolveUserLabel(dispatcherUsername, userInfoIndex)}
                          photo={resolveUserPhoto(dispatcherUsername, userInfoIndex)}
                          size="xs"
                        />
                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {t("case.display.map_case_assigned_by", {
                            name: resolveUserLabel(dispatcherUsername, userInfoIndex)
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  <LocateFixed className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export const CaseResponderList = memo(CaseResponderListBase);
CaseResponderList.displayName = "CaseResponderList";
