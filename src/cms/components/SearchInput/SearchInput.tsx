import { X, Search } from "lucide-react";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Input from "@/core/components/form/input/InputField";
import { useTranslation } from "@/core/hooks/useTranslation";


export const SearchInput: React.FC<{
    options: any[];
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
    disabled?: boolean;
    isDynamic?: boolean;
    className?: string;
    showResults?: boolean;
    maxResults?: number;
    allowCustomValue?: boolean;
}> = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Search...", 
    disabled, 
    isDynamic = false, 
    className = "",
    showResults = true,
    maxResults = 10,
    allowCustomValue = true
}) => {
    const [searchTerm, setSearchTerm] = useState(value);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const {t} = useTranslation();
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options.slice(0, maxResults);
        const filtered = options.filter(opt => {
            const label = isDynamic ? opt.value : opt;
            return label.toLowerCase().includes(searchTerm.toLowerCase());
        });
        return filtered.slice(0, maxResults);
    }, [options, searchTerm, isDynamic, maxResults]);
    
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setSelectedIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        setShowDropdown(true);
        setSelectedIndex(-1);
        
        if (allowCustomValue) {
            onChange(newValue);
        }
    }, [onChange, allowCustomValue]);

    const handleSelect = useCallback((option: any) => {
        const selectedValue = isDynamic ? option.value : option;
        setSearchTerm(selectedValue);
        onChange(selectedValue);
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
    }, [onChange, isDynamic]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!showDropdown || filteredOptions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[selectedIndex]);
                } else if (allowCustomValue && searchTerm.trim()) {
                    onChange(searchTerm.trim());
                    setShowDropdown(false);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    }, [showDropdown, filteredOptions, selectedIndex, handleSelect, allowCustomValue, searchTerm, onChange]);

    const handleFocus = useCallback(() => {
        if (showResults) {
            setShowDropdown(true);
        }
    }, [showResults]);

    const clearSearch = useCallback(() => {
        setSearchTerm("");
        onChange("");
        setShowDropdown(false);
        inputRef.current?.focus();
    }, [onChange]);

    return (
        <div className={className}>
            <div className="relative" ref={wrapperRef}>
                <div className="relative">
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={handleFocus}
                        disabled={disabled}
                        className="pr-20"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                        {searchTerm && !disabled && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                tabIndex={-1}
                            >
                                <X size={16} />
                            </button>
                        )}
                        <Search size={16} className="text-gray-400" />
                    </div>
                </div>

                {showResults && showDropdown && filteredOptions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700 top-full mt-1">
                        <ul className="max-h-60 overflow-auto custom-scrollbar">
                            {filteredOptions.map((option, index) => {
                                const optionValue = isDynamic ? option.value : option;
                                const optionKey = isDynamic ? option.value : `${option}-${index}`;
                                const isSelected = index === selectedIndex;
                                
                                return (
                                    <li
                                        key={optionKey}
                                        onClick={() => handleSelect(option)}
                                        className={`px-4 py-2 text-sm cursor-pointer ${
                                            isSelected 
                                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-white dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {optionValue}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {showResults && showDropdown && searchTerm && filteredOptions.length === 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-gray-900 rounded-md shadow-lg border dark:border-gray-700 top-full mt-1">
                        <div className="px-4 py-2 text-sm text-gray-500 italic">
                            {t("common.no_result")}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};