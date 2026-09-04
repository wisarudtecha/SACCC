import { SearchableSelect } from "@/cms/components/SearchInput/SearchSelectInput";
import { REQUIRED_ELEMENT as requireElements } from "@/cms/components/case/constants/caseConstants";
import { Area, mergeArea } from "@/cms/store/api/area";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CaseFieldSectionProps } from "./types";

interface CaseAreaSelectProps extends CaseFieldSectionProps {
    areaList: Area[];
    disabled?: boolean;
    /**
     * The field is disabled because the incident location resolved to exactly
     * one Service Center polygon (create-time auto-lock), not because the case
     * already exists. Only changes the helper text shown to the dispatcher.
     */
    autoLocked?: boolean;
    /** Show the red required marker next to the label. */
    required?: boolean;
    className?: string;
}

/** "Service center" - the area that owns the case. */
export const CaseAreaSelect = ({
    caseState,
    onCaseChange,
    areaList,
    disabled = false,
    autoLocked = false,
    required = true,
    className = "2xsm:my-4 2xsm:mx-3",
}: CaseAreaSelectProps) => {
    const { t, language } = useTranslation();

    const handleSetArea = (selectedName: string) => {
        const selected = areaList.find(item => mergeArea(item, language) === selectedName);
        onCaseChange({ area: selected });
    };

    return (
        <div>
            <h3 className="w-auto text-gray-900 dark:text-gray-400 mx-3">
                {t("case.display.service_center")} : {required && requireElements}
            </h3>
            <SearchableSelect
                options={areaList.map(item => mergeArea(item, language))}
                value={caseState?.area ? mergeArea(caseState.area, language) : ""}
                disabled={disabled}
                onChange={handleSetArea}
                placeholder={t("case.display.select_service_center")}
                className={className}
            />
            {autoLocked && (
                <p className="mx-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t("case.display.service_center_auto")}
                </p>
            )}
        </div>
    );
};
