// /src/components/form/CustomizableSelect.tsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import Input from "@/core/components/form/input/InputField";
import { CloseIcon } from "@/core/icons";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  className?: string;
  disabled?: boolean;
  // key?: string;
  multiple?: boolean;
  onModal?: boolean;
  options?: Option[];
  placeholder?: string;
  value?: string[] | string; // support multi-select
  asyncFetch?: (query: string, page: number) => Promise<Option[]>;
  onCallback?: (value: boolean) => void;
  onChange: (value: string[] | string) => void;
}

const CustomizableSelect: React.FC<CustomSelectProps> = ({
  className = "",
  disabled = false,
  // key = new Date().getTime().toString(),
  multiple = true,
  onModal = false,
  options = [],
  placeholder = "Select...",
  value = [],
  asyncFetch,
  onCallback,
  onChange
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [fetchedOptions, setFetchedOptions] = useState<Option[]>(options);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 10;

  // const loadOptions = async (query: string, page: number) => {
  //   if (!asyncFetch) {
  //     return;
  //   }
  //   const newOptions = await asyncFetch(query, page);
  //   setFetchedOptions(prev => (page === 1 ? newOptions : [...prev, ...newOptions]));
  // };

  useEffect(() => {
    if (!asyncFetch) {
      // Client-side filtering logic
      const filtered = options.filter(opt =>
        opt.label?.toLowerCase().includes(inputValue.toLowerCase())
      );

      // const pageSize = 20;
      const start = (page - 1) * pageSize;
      const end = page * pageSize;

      const nextChunk = filtered.slice(start, end);

      setHasMore(end < filtered.length);

      setFetchedOptions(prev => {
        if (page === 1) {
          return nextChunk;
        }

        const map = new Map(
          [...prev, ...nextChunk].map(item => [item.value, item])
        );

        return Array.from(map.values());

        // page === 1 ? filtered.slice(start, end) : [...prev, ...filtered.slice(start, end)]
    });

      return;
    }

    if (inputValue.length < 3) {
      setFetchedOptions([]); // Clear options if not enough characters
      setHasMore(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true);

      const newOptions = await asyncFetch(inputValue, page);

      setFetchedOptions(prev => {
        if (page === 1) {
          return newOptions;
        }

        const map = new Map(
          [...prev, ...newOptions].map(item => [item.value, item])
        );

        return Array.from(map.values());
      });

      setHasMore(newOptions.length > 0);
      setIsLoading(false);
    }, 300);

    // const delayDebounce = setTimeout(() => {
    //   loadOptions(inputValue, page);
    // }, 3000); // Wait 3 seconds

    return () => clearTimeout(delayDebounce);
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, page, asyncFetch, options]);

  const toggleOption = (val: string) => {
    if (!multiple) {
      const updated = val;

      onChange(updated);
      setIsOpen(false);
      setInputValue("");

      return;
    }

    const updated = Array.isArray(value) && value.includes(val)
      ? value.filter(v => v !== val)
      : [...value, val];

    onChange(updated);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    if (scrollTop + clientHeight >= scrollHeight - 5
      && hasMore && !isLoading
    ) {
      setPage(prev => prev + 1);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    // setInputValue("");

    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setInputValue("");
      setPage(1);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus the search input as soon as the list opens
  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  const getOptionLabel = (val: string): string => {
    // First try to find in original options
    const optionLabel = options.find(opt => opt.value === val)?.label;

    if (optionLabel) {
      return optionLabel;
    }
    
    // Fallback to fetchedOptions (for async loaded items)
    const fetchedLabel = fetchedOptions.find(opt => opt.value === val)?.label;

    return fetchedLabel || val;
  };

  const handleOpen = () => {
    if (disabled) {
      return;
    }

    setPage(1);
    setHasMore(true);
    setIsOpen(prev => !prev);
  };

  const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();

    onChange(multiple ? [] : "");
    setInputValue("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`
          min-h-11 w-full appearance-none rounded-lg border px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 cursor-pointer 
          border-gray-300 bg-transparent placeholder:text-gray-400 focus:border-brand-300 focus:ring-brand-500/10 text-gray-400 
          dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:text-gray-400 
          ${disabled && "opacity-50" || ""}
        `}
        onClick={handleOpen}
        // onClick={() => !disabled && setIsOpen(prev => !prev)}
      >
        {value && value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(value) && value.map(val => {
              // const label = fetchedOptions.find(opt => opt.value === val)?.label || val;
              const label = getOptionLabel(val);

              return (
                <span
                  key={val}
                  // className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded text-xs"
                  className={`${multiple
                    && "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded text-xs"
                    || "text-gray-800 dark:text-white/90"
                  }`}
                >
                  {label}
                </span>
              );
            }) || <span className="text-gray-800 dark:text-white/90">{getOptionLabel(value as string)}</span>}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">{t("common.search_placeholder") || placeholder}</span>
        )}
      </div>

      {hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear selection"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div
          onScroll={handleScroll}
          className={`
            ${!onModal && "absolute max-h-60" || ""}
            z-99999 mt-1 w-full overflow-y-auto rounded border bg-white dark:bg-gray-900 shadow-lg
          `}
        >
          <Input
            ref={searchInputRef}
            type="text"
            value={inputValue}
            onChange={e => {
              setPage(1);
              setInputValue(e.target.value);
            }}
            className="rounded-none border-0 border-b-2"
            placeholder={t("common.search_placeholder")}
          />
          {fetchedOptions?.length && (fetchedOptions.map(opt => (
            <div
              key={opt.value}
              // key={`${opt.value}-${new Date().getTime()}`}
              // key={opt.label}
              onClick={() => toggleOption(opt.value)}
              className={`
                px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white
                ${Array.isArray(value) ? value.includes(opt.value) : value === opt.value // value.includes(opt.value)
                  && "bg-blue-100 dark:bg-blue-800 text-gray-900 dark:text-white"
                  || ""
                }
              `}
            >
              {opt.label}
            </div>
          ))) || (onCallback && (
            <span className="block px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
              No options found,
              <a className="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer ml-1"
                onClick={value => onCallback?.(value as unknown as boolean)}
              >
                Click here to add new.
              </a>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomizableSelect;
