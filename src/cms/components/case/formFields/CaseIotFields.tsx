import { COMMON_INPUT_CSS as commonInputCss } from "@/cms/components/case/constants/caseConstants";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CaseFieldSectionProps } from "./types";

/** Free-text IoT device identifier. */
export const CaseIotDeviceInput = ({ caseState, onCaseChange }: CaseFieldSectionProps) => {
    const { t } = useTranslation();

    return (
        <div className="px-3 mb-3">
            <h3 className="text-gray-900 dark:text-gray-400 mb-3">{t("case.display.iot_device")} :</h3>
            <input
                required
                type="text"
                className={`dark:[&::-webkit-calendar-picker-indicator]:invert ${commonInputCss}`}
                onChange={(e) => onCaseChange({ iotDevice: e.target.value })}
                value={caseState?.iotDevice || ""}
                placeholder={t("case.display.iot_device_placeholde")}
            />
        </div>
    );
};

/**
 * Timestamp of the IoT alert. Always disabled - it is populated from the alert
 * itself (or defaulted to now on create), never typed by an agent.
 */
export const CaseIotDateInput = ({ caseState, onCaseChange }: CaseFieldSectionProps) => {
    const { t } = useTranslation();

    return (
        <div className="px-3">
            <h3 className="text-gray-900 dark:text-gray-400 mb-3">{t("case.display.iot_alert_date")} :</h3>
            <input
                required
                type="datetime-local"
                className={`dark:[&::-webkit-calendar-picker-indicator]:invert ${commonInputCss}`}
                onChange={(e) => onCaseChange({ iotDate: e.target.value })}
                disabled
                value={caseState?.iotDate || ''}
                placeholder="Work Order"
            />
        </div>
    );
};

/** Read-only reference to the case this one was raised against. */
export const CaseWorkOrderRefInput = ({ caseState }: Pick<CaseFieldSectionProps, "caseState">) => (
    <div className="px-3">
        <h3 className="text-gray-900 dark:text-gray-400 mb-3">Work Order Reference :</h3>
        <input
            required
            type="text"
            className={`dark:[&::-webkit-calendar-picker-indicator]:invert ${commonInputCss}`}
            value={caseState?.workOrderRef || ""}
            placeholder="Work Order Reference"
            disabled={true}
        />
    </div>
);
