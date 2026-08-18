// /src/hooks/usePreview.ts
import { useState, useCallback, useMemo } from "react";
import { PreviewState } from "@/core/types/enhanced-crud";

interface UsePreviewResult<T> {
  previewState: PreviewState<T>;
  openPreview: (item: T, allItems: T[]) => void;
  closePreview: () => void;
  nextItem: () => void;
  prevItem: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export const usePreview = <T extends { id: string }>(): UsePreviewResult<T> => {
  const [previewState, setPreviewState] = useState<PreviewState<T>>({
    isOpen: false,
    item: null,
    currentIndex: 0,
    totalItems: 0
  });

  const [allItems, setAllItems] = useState<T[]>([]);

  const openPreview = useCallback((item: T, items: T[]) => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    setAllItems(items);
    setPreviewState({
      isOpen: true,
      item,
      currentIndex: Math.max(0, currentIndex),
      totalItems: items.length
    });
  }, []);

  const closePreview = useCallback(() => {
    setPreviewState(prev => ({
      ...prev,
      isOpen: false,
      item: null
    }));
  }, []);

  const nextItem = useCallback(() => {
    if (previewState.currentIndex < allItems.length - 1) {
      const nextIndex = previewState.currentIndex + 1;
      const nextItem = allItems[nextIndex];
      setPreviewState(prev => ({
        ...prev,
        item: nextItem,
        currentIndex: nextIndex
      }));
    }
  }, [previewState.currentIndex, allItems]);

  const prevItem = useCallback(() => {
    if (previewState.currentIndex > 0) {
      const prevIndex = previewState.currentIndex - 1;
      const prevItem = allItems[prevIndex];
      setPreviewState(prev => ({
        ...prev,
        item: prevItem,
        currentIndex: prevIndex
      }));
    }
  }, [previewState.currentIndex, allItems]);

  const canGoNext = useMemo(() => 
    previewState.currentIndex < allItems.length - 1, 
    [previewState.currentIndex, allItems.length]
  );

  const canGoPrev = useMemo(() => 
    previewState.currentIndex > 0, 
    [previewState.currentIndex]
  );

  return {
    previewState,
    openPreview,
    closePreview,
    nextItem,
    prevItem,
    canGoNext,
    canGoPrev
  };
};
