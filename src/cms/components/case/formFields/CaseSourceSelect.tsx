import { useMemo } from "react";
import { SearchableSelect } from "@/cms/components/SearchInput/SearchSelectInput";
import {
    REQUIRED_ELEMENT as requireElements,
    source,
} from "@/cms/components/case/constants/caseConstants";
import { sourceInterface } from "@/cms/types";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CaseFieldSectionProps } from "./types";

/** "Contact method" - how the case reached the contact center. */
export const CaseSourceSelect = ({ caseState, onCaseChange }: CaseFieldSectionProps) => {
    const { t } = useTranslation();

    const options = useMemo(
        () => source.map(method => ({ label: method.name, value: method.id })),
        []
    );

    return (
        <div className="px-3 col-span-1">
            <h3 className="text-gray-900 dark:text-gray-400 mb-3">
                {t("case.display.contact_method")} : {requireElements}
            </h3>
            <SearchableSelect
                isDynamic
                options={options}
                className="sm:my-3 sm:mb-3"
                // Keyed on the id, not the display name. The name is what gets persisted and
                // re-rendered elsewhere, so matching on it made this list's correctness depend
                // on every entry having a unique label - fine today, quietly wrong the first
                // time two channels share one.
                value={caseState?.source?.id ?? ""}
                onChange={(selectedId) => {
                    const selectedMethod = source.find(method => method.id === selectedId);
                    onCaseChange({ source: selectedMethod ?? {} as sourceInterface });
                }}
                placeholder={t("case.display.contact_method_placeholder")}
            />
        </div>
    );
};
