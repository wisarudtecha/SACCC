// The case's own details, as a compact read-only list inside the Case Panel.
//
// Shows the same facts as the "View full case details" modal (CaseDisplay), but
// as label/value rows sized for a 288px card. FormFieldValueDisplay is not reused
// here: it is a two-column grid of padded cards built for a 4xl dialog, and it
// can mount a map of its own.
//
// The work order number lives in the panel HEADER now, not here (see CasePanel),
// so it is not repeated as a row. Schedule date, IoT alert date and phone number
// were dropped by request - they duplicate what "View full case details" already
// shows and were judged not worth the space in a 288px card.
import { memo } from "react";
import { mergeArea } from "@/cms/store/api/area";
import type { CaseDetails } from "@/cms/types/case";
import { useTranslation } from "@/core/hooks/useTranslation";

const EMPTY_VALUE = "-";

interface CaseInfoRowProps {
  label: string;
  value: string;
}

function CaseInfoRow({ label, value }: CaseInfoRowProps) {
  return (
    <div>
      <dt className="text-[11px] text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="break-words text-xs font-medium text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}

interface CasePanelInfoSectionProps {
  caseData?: CaseDetails;
}

function CasePanelInfoSectionBase({ caseData }: CasePanelInfoSectionProps) {
  const { t, language } = useTranslation();

  const serviceCenter = caseData?.area ? mergeArea(caseData.area, language) : "";

  return (
    <dl className="space-y-2 border-b border-gray-200 p-3 dark:border-gray-700">
      <CaseInfoRow
        label={t("case.display.types")}
        value={caseData?.caseType?.caseType || EMPTY_VALUE}
      />
      <CaseInfoRow label={t("case.display.service_center")} value={serviceCenter || EMPTY_VALUE} />
      <CaseInfoRow label={t("case.display.area")} value={caseData?.location || EMPTY_VALUE} />
    </dl>
  );
}

export const CasePanelInfoSection = memo(CasePanelInfoSectionBase);
CasePanelInfoSection.displayName = "CasePanelInfoSection";

export default CasePanelInfoSection;
