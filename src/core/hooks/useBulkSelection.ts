// /src/hooks/useBulkSelection.ts
import { useState, useMemo, useCallback } from "react";

interface UseBulkSelectionResult<T> {
  selectedItems: T[];
  isSelected: (item: T) => boolean;
  isAllSelected: boolean;
  isPartialSelected: boolean;
  selectItem: (item: T) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelectAll: () => void;
  getSelectedCount: () => number;
}

export const useBulkSelection = <T extends { id: string }>(
  items: T[]
): UseBulkSelectionResult<T> => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.has(item.id)), 
    [items, selectedIds]
  );

  const isSelected = useCallback((item: T) => 
    selectedIds.has(item.id), 
    [selectedIds]
  );

  const isAllSelected = useMemo(() => 
    items.length > 0 && items.every(item => selectedIds.has(item.id)), 
    [items, selectedIds]
  );

  const isPartialSelected = useMemo(() => 
    selectedIds.size > 0 && !isAllSelected, 
    [selectedIds.size, isAllSelected]
  );

  const selectItem = useCallback((item: T) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        newSet.add(item.id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [isAllSelected, selectAll, deselectAll]);

  const getSelectedCount = useCallback(() => selectedIds.size, [selectedIds.size]);

  return {
    selectedItems,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectItem,
    selectAll,
    deselectAll,
    toggleSelectAll,
    getSelectedCount
  };
};
