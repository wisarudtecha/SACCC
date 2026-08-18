// /src/components/crud/AdvancedFilterPanel.tsx
import React, { useEffect, useState } from "react";
import {
  // FilterIcon,
  CloseIcon
} from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AdvancedFilter } from "@/core/types/enhanced-crud";
import type { FilterConfig } from "@/core/types/crud";
// import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import Checkbox from "@/core/components/form/input/Checkbox";
import Input from "@/core/components/form/input/InputField";
import Radio from "@/core/components/form/input/Radio";
import Select from "@/core/components/form/Select";
import Button from "@/core/components/ui/button/Button";

interface AdvancedFilterPanelProps {
  className?: string;
  filters: AdvancedFilter[];
  // title?: string;
  values: FilterConfig;
  onApply: () => void;
  onChange: (filters: FilterConfig) => void;
  onClearFilters?: () => void;
  onReset: () => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  className = "",
  filters,
  // title = "Advanced Filters",
  values,
  onApply,
  onChange,
  onClearFilters,
  onReset
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localValues, setLocalValues] = useState<FilterConfig>(values);

  // const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleFilterChange = (key: string, value: unknown) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  };

  // const handleFilterChanges = (key: string, value: string[]) => {
  //   setSelectedTags(value);
  //   setLocalValues(prev => ({ ...prev, [key]: value }));
  // };

  const handleApply = () => {
    onChange(localValues);
    onApply();
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalValues({});
    onReset();
    setIsOpen(false);
    
    onClearFilters?.();
  };

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  useEffect(() => {
    // console.log(localValues);
  }, [localValues]);

  // Check if filters should be conditionally shown
  const shouldShowFilter = (filter: AdvancedFilter): boolean => {
    if (!filter.conditionalOn) {
      return true;
    }
    
    const conditionalValue = localValues[filter.conditionalOn];
    return conditionalValue !== undefined && conditionalValue !== null && conditionalValue !== "";
  };


  const renderFilter = (filter: AdvancedFilter) => {
    if (!shouldShowFilter(filter)) {
      return null;
    }

    const value = localValues[filter.key];

    switch (filter.type) {
      case "text":
        return (
          <Input
            // type="text"
            value={value as string || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value as number || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value ? Number(e.target.value) : "")}
            placeholder={filter.placeholder}
            min={filter.min as unknown as string}
            max={filter.max as unknown as string}
            step={filter.step}
          />
        );
        
      case "date":
        return (
          <Input
            type="date"
            value={value as string || ""}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="cursor-pointer"
          />
        );

      case "select":
        return (
          <Select
            value={value as string || ""}
            onChange={(newValue) => handleFilterChange(filter.key, newValue)}
            // options={filter.options || []}
            options={filter.options?.map(opt => ({ value: opt.value, label: opt.label })) || []}
            placeholder={filter.placeholder}
            // multiple={filter.multiple}
            className="cursor-pointer"
          />
        );
      
      // case "customizable-select":
      //   return (
      //     <CustomizableSelect
      //       options={filter.options || []}
      //       value={selectedTags}
      //       onChange={(newValue) => handleFilterChanges(filter.key, newValue)}
      //       placeholder={filter.placeholder}
      //       onModal={true}
      //       className="cursor-pointer"
      //     />
      //   );

      case "multiselect":
        return null;
        // return (
        //   <MultiSelect
        //     options={filter.options || []}
        //     value={value as string[] || []}
        //     onChange={(newValue) => handleFilterChange(filter.key, newValue)}
        //     placeholder={filter.placeholder}
        //   />
        // );
      
      case "checkbox":
        return (
          <Checkbox
            checked={value as boolean || false}
            onChange={(checked) => handleFilterChange(filter.key, checked)}
            label={filter.placeholder || "Enable this option"}
          />
        );
      
      case "checkbox-group":
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <Checkbox
                key={option.value}
                checked={(value as string[] || []).includes(option.value)}
                onChange={(checked) => {
                  const currentValues = value as string[] || [];
                  const newValues = checked
                    ? [...currentValues, option.value]
                    : currentValues.filter(v => v !== option.value);
                  handleFilterChange(filter.key, newValues);
                }}
                label={option.label}
              />
            ))}
          </div>
        );
      
      case "radio":
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <Radio
                key={option.value}
                id={`${filter.key}-${option.value}`}
                name={filter.key}
                value={option.value}
                checked={value === option.value}
                onChange={(selectedValue) => handleFilterChange(filter.key, selectedValue)}
                label={option.label}
              />
            ))}
          </div>
        );

      case "toggle":
        return null;
        // return (
        //   <Toggle
        //     checked={value as boolean || false}
        //     onChange={(checked) => handleFilterChange(filter.key, checked)}
        //     label={filter.placeholder}
        //   />
        // );

      case "date-range":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              value={(value as { start?: string })?.start || ""}
              onChange={(e) => handleFilterChange(filter.key, {
                ...(value as { start?: string }),
                start: e.target.value
              })}
              placeholder="Start date"
              className="cursor-pointer"
            />
            <Input
              type="date"
              value={(value as { end?: string })?.end || ""}
              onChange={(e) => handleFilterChange(filter.key, {
                ...(value as { end?: string }),
                end: e.target.value
              })}
              placeholder="End date"
              className="cursor-pointer"
            />
          </div>
        );

      case "number-range":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              value={(value as { min?: string })?.min || ""}
              onChange={(e) => handleFilterChange(filter.key, {
                ...(value as { min?: string }),
                min: parseInt(e.target.value) || undefined
              })}
              placeholder={`Min (${filter.min || 0})`}
              min={`${filter.min}`}
              max={`${filter.max}`}
            />
            <Input
              type="number"
              value={(value as { max?: string })?.max || ""}
              onChange={(e) => handleFilterChange(filter.key, {
                ...(value as { max?: string }),
                max: parseInt(e.target.value) || undefined
              })}
              placeholder={`Max (${filter.max || 100})`}
              min={`${filter.min}`}
              max={`${filter.max}`}
            />
          </div>
        );
      
      case "color":
        return null;
        // return (
        //   <div className="flex items-center gap-2">
        //     <input
        //       type="color"
        //       value={value as string || "#000000"}
        //       onChange={(e) => handleFilterChange(filter.key, e.target.value)}
        //       className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
        //     />
        //     <Input
        //       type="text"
        //       value={value as string || ""}
        //       onChange={(e) => handleFilterChange(filter.key, e.target.value)}
        //       placeholder="#000000"
        //       className="flex-1"
        //     />
        //   </div>
        // );

      case "tags":
        return null;
        // return (
        //   <TagsInput
        //     value={value as string[] || []}
        //     onChange={(newValue) => handleFilterChange(filter.key, newValue)}
        //     placeholder={filter.placeholder}
        //   />
        // );
      
      case "boolean":
        return null;

      default:
        return null;
    }
  };

  // const hasActiveFilters = Object.values(localValues).some(v => 
  //   v !== "" && v !== null && v !== undefined
  // );

  // Count active filters
  const activeFiltersCount = Object.values(localValues).filter(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object' && v !== null) return Object.values(v).some(val => val !== "" && val !== null && val !== undefined);
    return v !== "" && v !== null && v !== undefined && v !== false;
  }).length;

  // Group filters if groupBy is specified
  const groupedFilters = filters.reduce((groups, filter) => {
    const group = filter.groupBy || 'default';
    if (!groups[group]) groups[group] = [];
    groups[group].push(filter);
    return groups;
  }, {} as Record<string, AdvancedFilter[]>);

  return (
    <div className={className}>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        // className="h-11"
        className="h-11 relative"
      >
        {/* <FilterIcon className="w-4 h-4" /> */}
        {t("crud.common.search_advanced")}
        
        {/*
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-xs">
            {Object.values(localValues).filter(v => v !== "" && v !== null && v !== undefined).length}
          </span>
        )}
        */}
        {activeFiltersCount > 0 && (
          <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-xs font-medium">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        // className="max-w-2xl p-6"
        className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {t("crud.common.search_advanced")}
          </h3>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedFilters).map(([groupName, groupFilters]) => (
            <div key={groupName}>
              {/*
              {groupName !== 'default' && (
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {groupName}
                </h4>
              )}
              */}
              <div className="grid grid-cols-1 gap-6">
                {groupFilters.map(filter => (
                  <div key={filter.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {filter.label}
                        {filter.required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
                      </label>
                      {filter.description && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                          {filter.description}
                        </span>
                      )}
                    </div>
                    {renderFilter(filter)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/*
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {filters.map(filter => (
            <div key={filter.key} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {filter.label}
              </label>
              {renderFilter(filter)}
            </div>
          ))}
        </div>
        */}

        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mr-3 cursor-default">
            {activeFiltersCount > 0 ? (
              // `${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} active`
              `${activeFiltersCount} ${t("crud.common.count_filters").replace("_S_", activeFiltersCount !== 1 ? "s" : "")}`
            ) : (
              t("crud.common.no_filters")
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={handleReset} variant="outline">
              {t("crud.common.reset_all")}
            </Button>
            <Button onClick={handleApply} variant="primary">
              {t("crud.common.apply_filters")} ({activeFiltersCount})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
