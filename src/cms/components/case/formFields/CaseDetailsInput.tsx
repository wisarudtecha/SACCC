import {
    COMMON_INPUT_CSS as commonInputCss,
    detailsStringLimit,
    REQUIRED_ELEMENT as requireElements,
} from "@/cms/components/case/constants/caseConstants";
import TextAreaWithCounter from "@/core/components/form/input/TextAreaWithCounter";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CaseFieldSectionProps } from "./types";

interface CaseDetailsInputProps extends CaseFieldSectionProps {
    className?: string;
}

/** The free-text case description. */
export const CaseDetailsInput = ({
    caseState,
    onCaseChange,
    className = "pr-6 mb-3",
}: CaseDetailsInputProps) => {
    const { t } = useTranslation();

    return (
        <div className={className}>
            <h3 className="text-gray-900 dark:text-gray-400 mx-4">
                {t("case.display.case_detail")}: {requireElements}
            </h3>
            <TextAreaWithCounter
                maxLength={detailsStringLimit}
                onChange={(e) => onCaseChange({ description: e.target.value })}
                value={caseState?.description || ""}
                placeholder={t("case.display.case_detail_placeholder")}
                className={`w-full h-20 ${commonInputCss}`}
                containnerClass="m-3"
                required
            />
        </div>
    );
};
