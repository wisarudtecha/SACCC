import type React from "react";
import { useEffect, useState, useRef } from "react";

interface Option {
  value: string;
  text: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  /** Controlled selected values. When provided, the component reflects external state. */
  selected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  selected: controlledSelected,
  onChange,
  disabled = false,
}) => {
  const isControlled = controlledSelected !== undefined;
  const [internalSelected, setInternalSelected] =
    useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOptions = isControlled ? controlledSelected : internalSelected;

  // Sync external controlled changes
  useEffect(() => {
    if (isControlled && controlledSelected !== undefined) {
      setInternalSelected(controlledSelected);
    }
  }, [isControlled, controlledSelected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const newSelectedOptions = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((value) => value !== optionValue)
      : [...selectedOptions, optionValue];

    if (!isControlled) {
      setInternalSelected(newSelectedOptions);
    }
    onChange?.(newSelectedOptions);
  };

  const removeOption = (value: string) => {
    const newSelectedOptions = selectedOptions.filter((opt) => opt !== value);
    if (!isControlled) {
      setInternalSelected(newSelectedOptions);
    }
    onChange?.(newSelectedOptions);
  };

  const selectedValuesText = selectedOptions
    .map(
      (value) => options.find((option) => option.value === value)?.text || ""
    )
    .filter(Boolean);

  // Build single-line display: first item + count of remaining
  const renderTriggerContent = () => {
    if (selectedValuesText.length === 0) {
      return (
        <input
          placeholder="Select option"
          className="w-full h-full p-1 pr-2 text-sm bg-transparent border-0 outline-hidden appearance-none placeholder:text-gray-800 focus:border-0 focus:outline-hidden focus:ring-0 dark:placeholder:text-white/90"
          readOnly
          value="Select option"
        />
      );
    }

    if (selectedValuesText.length === 1) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-white/90">
            <span className="truncate max-w-[200px]">{selectedValuesText[0]}</span>
            <div
              onClick={(e) => {
                e.stopPropagation();
                removeOption(selectedOptions[0]);
              }}
              className="pl-2 text-gray-500 cursor-pointer hover:text-gray-400 dark:text-gray-400"
            >
              <svg
                className="fill-current"
                role="button"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    // Multiple items: show first + count of additional
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-white/90">
          <span className="truncate max-w-[200px]">{selectedValuesText[0]}</span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              removeOption(selectedOptions[0]);
            }}
            className="pl-2 text-gray-500 cursor-pointer hover:text-gray-400 dark:text-gray-400"
          >
            <svg
              className="fill-current"
              role="button"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
              />
            </svg>
          </div>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          +{selectedValuesText.length - 1} more
        </span>
      </div>
    );
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div onClick={toggleDropdown} className="w-full cursor-pointer">
            <div className="flex h-11 items-center rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300">
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                {renderTriggerContent()}
              </div>
              <div className="flex shrink-0 items-center py-1 pl-1 pr-1 w-7">
                <button
                  type="button"
                  onClick={toggleDropdown}
                  className="w-5 h-5 text-gray-700 outline-hidden cursor-pointer focus:outline-hidden dark:text-gray-400"
                >
                  <svg
                    className={`stroke-current ${isOpen ? "rotate-180" : ""}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 z-40 w-full overflow-hidden rounded-lg bg-white shadow-sm top-full dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-60 overflow-y-auto flex flex-col">
                {options.map((option) => {
                  const isSelected = selectedOptions.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={`w-full cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 dark:border-gray-800 ${
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                      onClick={() => handleSelect(option.value)}
                    >
                      <div className="relative flex w-full min-h-10 items-center px-3 py-2">
                        <span
                          className={`flex-1 break-words text-sm leading-5 ${
                            isSelected
                              ? "font-medium text-brand-700 dark:text-brand-300"
                              : "text-gray-800 dark:text-white/90"
                          }`}
                        >
                          {option.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
