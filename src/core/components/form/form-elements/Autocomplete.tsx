// /src/components/form/form-elements/Autocomplete.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import Input from "@/core/components/form/input/InputField";

type AutocompleteProps = {
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  required?: boolean;
  suggestions?: string[];
  value?: string;
  onSelect: (value: string) => void;
};

export const Autocomplete: React.FC<AutocompleteProps> = ({
  disabled,
  id = "",
  placeholder = "Start typing...",
  required,
  suggestions,
  value = "",
  onSelect,
}) => {
  // const [query, setQuery] = useState("");
  const [query, setQuery] = useState(value);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [showList, setShowList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceLengthWating = 0;
  // const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeWaiting = 0; // Second
  // const suggestions = ["bma", "skyai"];
  const defaultSuggestions = ["BMA", "SKY-AI"];

  const handleSelect = useCallback((val: string) => {
    setQuery(val);
    setShowList(false);
    onSelect(val);
  }, [onSelect]);

  useEffect(() => {
    setQuery(value);
    handleSelect(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query) {
      const result = (suggestions || defaultSuggestions).filter(s =>
        s === query
      );
      if (result.length > 0) {
        setFiltered([]);
        setShowList(false);
        setLoading(false);
        return;
      }
      else {
        // const results = suggestions.filter(s =>
        //   s.toLowerCase().includes(query.toLowerCase())
        // );
        // setFiltered(results);
        // setShowList(true);

        // if (query.length < debounceLengthWating) {
        //   setFiltered([]);
        //   setShowList(false);
        //   setLoading(false);
        //   return;
        // }

        // Only trigger suggestions if user stopped typing in seconds
        debounceTimer.current = setTimeout(() => {
          if (query.length >= debounceLengthWating) {
            setLoading(true);
            setTimeout(() => {
              const result = (suggestions || defaultSuggestions).filter((s) =>
                s.toLowerCase().includes(query.toLowerCase())
              );
              setFiltered(result);
              setShowList(result.length > 0);
              setLoading(false);
            }, debounceTimeWaiting * 1);
          }
        }, debounceTimeWaiting * 1000);

        return () => {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
        };
      }
    }
    else {
      setFiltered([]);
      setShowList(false);
      setLoading(false);
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // const handleSelect = (val: string) => {
  //   setQuery(val);
  //   setShowList(false);
  //   onSelect(val);
  // };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
    }
    else if (e.key === "ArrowUp") {
      setActiveIndex(prev => Math.max(prev - 1, 0));
    }
    else if (e.key === "Enter" && activeIndex >= 0) {
      handleSelect(filtered[activeIndex]);
    }
    else if (e.key === "Escape") {
      setShowList(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <Input
        id={id}
        // className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={query}
        onChange={e => {
          // setQuery(e.target.value);
          handleSelect(e.target.value);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => query && setShowList(true)}
        disabled={disabled}
        required={required}
      />
      {showList && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-12 z-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-md max-h-60 overflow-y-auto"
        >
          {filtered.map((item, index) => (
            <li
              key={item}
              className={`px-4 py-2 cursor-pointer ${
                index === activeIndex ? "bg-blue-100 dark:bg-blue-800" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
              }`}
              onMouseDown={() => handleSelect(item)} // Prevent input blur before select
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <ul className="absolute top-12 z-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-md max-h-60 overflow-y-auto">
          <li key="loading" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500">Loading...</li>
        </ul>
      )}
    </div>
  );
};

