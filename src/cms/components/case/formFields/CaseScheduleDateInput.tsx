import { registerLocale } from "react-datepicker";
import { th, enUS } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { COMMON_INPUT_CSS as commonInputCss } from "@/cms/components/case/constants/caseConstants";
import { getTodayDate } from "@/cms/components/date/DateToString";
import DatePickerLocal from "@/core/components/form/input/DatepicketLocal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CaseFieldSectionProps } from "./types";

/**
 * Serialises the picked date as a local (not UTC) datetime string, so the value
 * the user sees is the value that gets sent.
 */
const toLocalDateTimeString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/** Requested schedule date for a scheduled case. */
export const CaseScheduleDateInput = ({ caseState, onCaseChange }: CaseFieldSectionProps) => {
    const { t, language } = useTranslation();

    if (language === "th") {
        registerLocale("th", th);
    } else {
        registerLocale("en", enUS);
    }

    return (
        <div className="px-3 mb-3">
            <div className="flex mb-3">
                <h3 className="text-gray-900 dark:text-gray-400 mr-2">
                    {t("case.display.request_schedule_date")} :
                </h3>
            </div>
            <DatePickerLocal
                selected={caseState?.scheduleDate ? new Date(caseState.scheduleDate) : null}
                onChange={(date: Date | null) =>
                    onCaseChange({ scheduleDate: date ? toLocalDateTimeString(date) : "" })
                }
                language={language}
                dateFormat="P"
                minDate={getTodayDate()}
                popperClassName="z-50"
                wrapperClassName="w-full"
                className={`p-2 w-full dark:[&::-webkit-calendar-picker-indicator]:invert ${commonInputCss}`}
                placeholderText={t("case.display.schedule_placeholder")}
                locale={language === 'th' ? 'th' : 'en'}
            />
        </div>
    );
};
