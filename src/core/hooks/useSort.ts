// /src/hooks/useSort.ts
import { useState, useMemo } from "react";
import type { SortConfig } from "@/core/types/crud";

export interface UseSortResult<T> {
  sortConfig: SortConfig<T>;
  handleSort: (key: keyof T) => void;
  sortedData: T[];
  resetSort: () => void;
}

export const useSort = <T>(data: T[]): UseSortResult<T> => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({ 
    key: null, 
    direction: "asc" 
  });

  const handleSort = (key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!] ?? "";
      const bValue = b[sortConfig.key!] ?? "";
      
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const resetSort = () => {
    setSortConfig({ key: null, direction: "asc" });
  };

  return {
    sortConfig,
    handleSort,
    sortedData,
    resetSort
  };
};
