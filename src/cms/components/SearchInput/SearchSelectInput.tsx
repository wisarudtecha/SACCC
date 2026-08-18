import { ChevronsUpDown, X } from "lucide-react";
import Input from "@/core/components/form/input/InputField";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COMMON_INPUT_CSS } from "../case/constants/caseConstants";
import { useTranslation } from "@/core/hooks/useTranslation";

export const SearchableSelect: React.FC<{
    options: any[],
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
    disabled?: boolean;
    disabledRemoveButton?: boolean
    disabledChevronsIcon?: boolean
    isDynamic?: boolean;
    className?: string;
    prefixedStringValue?: string
    subfixedStringValue?: string
    enableI18Nlable?: boolean
}> = ({ options, value, onChange, placeholder, disabled, isDynamic = false, className = "", disabledRemoveButton = false, prefixedStringValue = "", disabledChevronsIcon = false, subfixedStringValue = "", enableI18Nlable = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    // const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
    // const [dropdownPosition] = useState<'bottom' | 'top'>('bottom');
    const wrapperRef = useRef<HTMLDivElement>(null);
    // const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => {
            let label = isDynamic
                ? (opt.label ?? opt.value)
                : opt;

            label = prefixedStringValue + label + subfixedStringValue;
            return label.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [options, searchTerm, isDynamic]);

    const selectedLabel = useMemo(() => {
        const selected = options.find(opt => (isDynamic ? opt.value : opt) === value);
        if (!selected) return placeholder || "Select an option";

        if (isDynamic) {
            const rawLabel = selected.label ?? selected.lable ?? selected.value;
            return enableI18Nlable ? t(rawLabel) : rawLabel;
        }
        return selected;
    }, [options, value, placeholder, isDynamic, t, enableI18Nlable]);

    // Calculate dropdown position
    const calculatePosition = useCallback(() => {
        // if (!wrapperRef.current) return;

        // const rect = wrapperRef.current.getBoundingClientRect();
        // const windowHeight = window.innerHeight;
        // const dropdownHeight = 300; // Approximate max height (60*4 + padding + search input)

        // const spaceBelow = windowHeight - rect.bottom;
        // const spaceAbove = rect.top;

        // if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        //     setDropdownPosition('top');
        // } else {
        //     setDropdownPosition('bottom');
        // }
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Calculate position when dropdown opens
    useEffect(() => {
        if (isOpen) {
            calculatePosition();
            // Recalculate on scroll/resize
            const handleScroll = () => calculatePosition();
            const handleResize = () => calculatePosition();

            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [isOpen, calculatePosition]);

    const handleSelect = (option: any) => {
        onChange(isDynamic ? option.value : option);
        setIsOpen(false);
        setSearchTerm("");
    };

    // const dropdownClasses = `
    //     absolute z-10 w-full bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700
    //     ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}
    // `;

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setSearchTerm("");
    };

    return (
        <div className={className}>
            <div className="relative" ref={wrapperRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`${COMMON_INPUT_CSS} appearance-none border rounded-md w-full py-3 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent dark:text-gray-300 dark:border-gray-800 dark:bg-gray-900 disabled:text-gray-500 disabled:border-gray-300 disabled:opacity-40 disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:disabled:text-gray-400 dark:disabled:border-gray-700 text-left flex justify-between items-center`}
                >
                    <span className="truncate">{prefixedStringValue}{selectedLabel}{subfixedStringValue}</span>
                    <div className="flex items-center gap-2">
                        {value && !disabled && !disabledRemoveButton && (
                            <div
                                onClick={handleClear}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                            >
                                <X size={16} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                            </div>
                        )}
                        {!disabledChevronsIcon && <ChevronsUpDown size={16} className="text-gray-400" />}
                    </div>
                </button>
                {isOpen && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700 top-full mt-1">
                        <div className="p-2">
                            <Input
                                type="text"
                                placeholder={placeholder || t("common.search_placeholder")}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <ul className="max-h-60 overflow-auto custom-scrollbar">
                            {filteredOptions.map((option, index) => {
                                // const optionValue = isDynamic ? option.value : option;
                                const optionKey = isDynamic ? option.value : `${option}-${index}`;
                                return (
                                    <li
                                        key={optionKey}
                                        onClick={() => handleSelect(option)}
                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-700 cursor-pointer"
                                    >
                                        {isDynamic
                                            ? (enableI18Nlable
                                                ? t(option.label ?? option.lable ?? option.value)
                                                : (option.label ?? option.lable ?? option.value))
                                            : option}

                                    </li>
                                );
                            })}
                            {filteredOptions.length === 0 && (
                                <li className="px-4 py-2 text-sm text-gray-500 italic">
                                    {t("common.noOption")}
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
interface ApiOption {
    [key: string]: any;
}

interface SearchableSelectApiProps<T extends ApiOption> {
    value: string;
    onChange?: (newValue: string) => void;
    placeholder?: string;
    disabled?: boolean;
    apiQuery: any;
    queryParams?: Record<string, any>;
    searchKey?: string;
    labelKey: (keyof T | string) | (keyof T | string)[];
    labelSparator?: string
    valueKey: keyof T;
    className?: string;
    id?: string
    onChangeObject?: (option: T) => void;
    isRefetchOnMountOrArgChange?: boolean
    autoEnterValue?: boolean
    enableApiSearch?: boolean
    searchPlaceholder?: string,
    enablePaginate?: boolean
    // Known label for the current `value` when it isn't (yet) present in the fetched
    // options page - avoids falling back to the raw id (e.g. right after creating/importing
    // a new option whose list hasn't been refetched/paginated in yet).
    selectedLabelFallback?: string
}


export const SearchableSelectApi = <T extends ApiOption>({
    value,
    onChange,
    placeholder,
    disabled,
    apiQuery,
    queryParams = {},
    labelKey,
    valueKey,
    className = "",
    id,
    onChangeObject,
    labelSparator = "-",
    isRefetchOnMountOrArgChange = false,
    autoEnterValue = false,
    searchKey = "search",
    enableApiSearch = false,
    searchPlaceholder = "Search...",
    enablePaginate = false,
    selectedLabelFallback
}: SearchableSelectApiProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [combinedOptions, setCombinedOptions] = useState<T[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);


    const getLabel = (option: T) => {
        const getValueByPath = (obj: any, path: string) => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        if (Array.isArray(labelKey)) {
            return labelKey
                .map(key => getValueByPath(option, key as string))
                .filter(val => val !== undefined && val !== null && val !== "")
                .join(labelSparator);
        }

        return String(getValueByPath(option, labelKey as string) || "");
    };

    useEffect(() => {
        if (!enableApiSearch) {
            setSearchTerm("");
            return;
        }

        const handler = setTimeout(() => {
            setSearchTerm(localSearch);
        }, 500);

        return () => clearTimeout(handler);
    }, [localSearch, enableApiSearch]);

    const apiQueryParams = useMemo(() => ({
        ...queryParams,
        [searchKey]: searchTerm,
        start: page,
        length: enablePaginate ? 20 : 1000
    }), [queryParams, searchTerm, page, searchKey, enableApiSearch]);

    const { data: apiResponse, isFetching, error } = apiQuery(apiQueryParams, {
        skip: !isOpen && value == "",
        refetchOnMountOrArgChange: isRefetchOnMountOrArgChange
    });


    const filteredOptions = useMemo(() => {
        if (enableApiSearch || !localSearch) return combinedOptions;

        return combinedOptions.filter(opt => {
            const searchString = getLabel(opt).toLowerCase();
            return searchString.includes(localSearch.toLowerCase());
        });
    }, [combinedOptions, localSearch, enableApiSearch, labelKey, labelSparator]);

    const handleSelect = (option: T) => {
        onChange && onChange(String(option[valueKey]));
        if (onChangeObject) onChangeObject(option);
        setIsOpen(false);
        setLocalSearch("");
        setSearchTerm("");
    };

    useEffect(() => {
        if (apiResponse?.data) {
            setCombinedOptions(prev => page === 0 ? apiResponse.data : [...prev, ...apiResponse.data]);

            if (autoEnterValue && apiResponse.data.length === 1) {
                const firstOption = apiResponse.data[0];
                onChange && onChange(String(firstOption[valueKey]));
                if (onChangeObject) onChangeObject(firstOption);
            }
        } else {
            if (combinedOptions.length > 0) {
                setCombinedOptions([]);
            }
        }
    }, [apiResponse, page, autoEnterValue, onChange, onChangeObject, valueKey]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setLocalSearch("");
                setSearchTerm("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
        if (!enablePaginate) return;

        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 5 && !isFetching && apiResponse) {
            if (apiResponse.currentPage < apiResponse.totalPage) {
                setPage(prev => prev + 20);
            }
        }
    };

    const handleToggleDropdown = () => {
        if (!isOpen) {
            setIsOpen(true);
            setPage(0);
        } else {
            setIsOpen(false);
            setLocalSearch("");
            setSearchTerm("");
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange && onChange("");
        if (onChangeObject) onChangeObject("" as any);
        setLocalSearch("");
        setSearchTerm("");
    };


    const selectedLabel = useMemo(() => {
        if (!value) return placeholder || "Select an option";
        const selected = combinedOptions.find(opt => String(opt[valueKey]) === String(value));


        return selected ? getLabel(selected) : (selectedLabelFallback || value);
    }, [combinedOptions, value, placeholder, labelKey, valueKey, labelSparator, selectedLabelFallback]);

    return (
        <div className={className}>
            <div className="relative" ref={wrapperRef}>
                <button
                    type="button"
                    onClick={handleToggleDropdown}
                    disabled={disabled}
                    className="appearance-none border rounded-md w-full py-3 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent dark:text-gray-300 dark:border-gray-800 dark:bg-gray-900 disabled:text-gray-500 disabled:border-gray-300 disabled:opacity-40 disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:disabled:text-gray-400 dark:disabled:border-gray-700 text-left flex justify-between items-center"
                >
                    <span className="truncate">{selectedLabel}</span>
                    <div className="flex items-center gap-2">
                        {value && !disabled && (
                            <div onClick={handleClear} className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors">
                                <X size={16} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                            </div>
                        )}
                        <ChevronsUpDown size={16} className="text-gray-400" />
                    </div>
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700 top-full mt-1">
                        <div className="p-2">
                            <Input
                                id={id}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={localSearch}
                                onChange={e => setLocalSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        <ul onScroll={handleScroll} className="max-h-60 overflow-auto custom-scrollbar">
                            {error ? <li className="px-4 py-2 text-sm text-red-500 italic">Error loading options</li> :
                                (combinedOptions && filteredOptions.length === 0) && !isFetching ? (
                                    <li className="px-4 py-2 text-sm text-gray-500 italic">No options found.</li>
                                ) : filteredOptions.map((option, index) => (
                                    <li
                                        key={`${option[valueKey]}-${index}`}
                                        onClick={() => handleSelect(option)}
                                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-700 cursor-pointer"
                                    >
                                        {getLabel(option)}
                                    </li>
                                ))}
                            {isFetching && (
                                <li className="px-4 py-2 text-sm text-gray-500 italic text-center">Loading...</li>
                            )}


                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};