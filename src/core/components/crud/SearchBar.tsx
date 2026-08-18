// /src/components/crud/SearchBar.tsx
import React, { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";
import { CloseIcon } from "@/core/icons";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  onClear,
  placeholder = "Search...",
  className = ""
}) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(e.target.value);
    onChange(e.target.value);

    // Auto-search as user types (debounced in real implementation)
    if (newValue.trim() === "") {
      onSearch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    if (onClear) {
      onClear();
    }
    else {
      onSearch();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
        />
        {localValue && (
          <Button
            onClick={handleClear}
            className="absolute right-0 top-1/2 transform -translate-y-1/2"
            variant="outline"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
      <Button
        onClick={onSearch}
        variant="dark"
        className="h-11"
      >
        {t("crud.common.search")}
      </Button>
    </div>
  );
};
