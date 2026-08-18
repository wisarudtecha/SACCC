// /src/components/crud/FilterBar.tsx
import React from "react";
import { CloseIcon } from "@/core/icons";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { FilterConfig, FilterDefinition } from "@/core/types/crud";
import Select from "@/core/components/form/Select";
import Button from "@/core/components/ui/button/Button";

interface FilterBarProps {
  filters: FilterDefinition[];
  hasActiveFilters?: boolean;
  values: FilterConfig;
  onChange: (key: string, value: string | number | boolean | undefined) => void;
  onClear: () => void;
  onClearFilters?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  hasActiveFilters,
  values,
  onChange,
  onClear,
  onClearFilters
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-4">
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-2">
          {filter.type === "select" && filter.options && (
            <Select
              value={values[filter.key] as string || ""}
              onChange={(value) => onChange(filter.key, value)}
              options={filter.options}
              placeholder={filter.placeholder || `Select ${filter.label}`}
              className="cursor-pointer"
            />
          )}
        </div>
      ))}

      {hasActiveFilters && (
        <Button
          // onClick={() => onClear}
          onClick={() => {
            onClear();
            onClearFilters?.();
          }}
          className="h-11"
        >
          <CloseIcon className="w-4 h-4" />
          {t("common.clear_filters")}
        </Button>
      )}
    </div>
  );
};
