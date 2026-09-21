// The case's own details, as a compact read-only list inside the Case Panel.
//
// Shows the same facts as the "View full case details" modal (CaseDisplay), but
// as label/value rows sized for a 288px card. FormFieldValueDisplay is not reused
// here: it is a two-column grid of padded cards built for a 4xl dialog, and it
// can mount a map of its own.
import { memo } from "react";
import { mergeArea } from "@/cms/store/api/area";
import type { CaseDetails } from "@/cms/types/case";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDate } from "@/core/utils/crud";

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
  const scheduleDate = caseData?.scheduleDate
    ? formatDate(caseData.scheduleDate, { includeTime: false })
    : "";
  const iotDate = caseData?.iotDate ? formatDate(caseData.iotDate) : "";

  return (
    <dl className="space-y-2 border-b border-gray-200 p-3 dark:border-gray-700">
      <CaseInfoRow
        label={t("case.display.no")}
        value={caseData?.workOrderNummber || EMPTY_VALUE}
      />
      <CaseInfoRow
        label={t("case.display.types")}
        value={caseData?.caseType?.caseType || EMPTY_VALUE}
      />
      <CaseInfoRow label={t("case.display.service_center")} value={serviceCenter || EMPTY_VALUE} />
      <CaseInfoRow label={t("case.display.area")} value={caseData?.location || EMPTY_VALUE} />
      <CaseInfoRow
        label={t("case.display.request_schedule_date")}
        value={scheduleDate || EMPTY_VALUE}
      />
      {iotDate && <CaseInfoRow label={t("case.display.iot_alert_date")} value={iotDate} />}
      <CaseInfoRow
        label={t("case.display.phone_number")}
        value={caseData?.customerData?.mobileNo || EMPTY_VALUE}
      />
    </dl>
  );
}

export const CasePanelInfoSection = memo(CasePanelInfoSectionBase);
CasePanelInfoSection.displayName = "CasePanelInfoSection";

export default CasePanelInfoSection;
