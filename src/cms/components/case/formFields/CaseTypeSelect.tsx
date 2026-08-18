import { SearchableSelect } from "@/cms/components/SearchInput/SearchSelectInput";
import { REQUIRED_ELEMENT as requireElements } from "@/cms/components/case/constants/caseConstants";
import { useTranslation } from "@/core/hooks/useTranslation";

interface CaseTypeSelectProps {
    value: string;
    options: string[];
    onChange: (caseType: string) => void;
    disabled?: boolean;
}

export const CaseTypeSelect = ({ value, options, onChange, disabled = false }: CaseTypeSelectProps) => {
    const { t } = useTranslation();

    return (
        <div className="text-white dark:text-gray-300">
            <div className="flex justify-between mx-3 text-gray-900 dark:text-gray-400">
                <h3 className="mb-3 block text-gray-900 dark:text-gray-400">
                    {t("case.display.types")} :{requireElements}
                </h3>
            </div>
            <SearchableSelect
                options={options}
                value={value}
                onChange={onChange}
                placeholder={t("case.display.select_types_placeholder")}
                className={`2xsm:mx-3 mb-2`}
                disabled={disabled}
            />
        </div>
    );
};
