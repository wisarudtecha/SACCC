// /src/hooks/usePagination.ts
import { useMemo, useState } from "react";
import type { PaginationConfig } from "@/core/types/crud";

export interface UsePaginationResult {
  pagination: PaginationConfig;
  endEntry: number;
  startEntry: number;
  totalPages: number;
  changePageSize: (size: number) => void;
  goToPage: (page: number) => void;
  resetPagination: () => void;
  setPagination: React.Dispatch<React.SetStateAction<PaginationConfig>>;
}

export const usePagination = (
  total: number = 0,
  initialPageSize: number = 10,
  // page: number = 0,
  // totalPage: number = 0
): UsePaginationResult => {
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: initialPageSize,
    total
  });

  // const [pagination, setPagination] = useState<PaginationConfig>({
  //   page: page || 1,
  //   pageSize: initialPageSize,
  //   total
  // });

  const endEntry = useMemo(() => 
    Math.min(pagination.page * pagination.pageSize, total), 
    [pagination.page, pagination.pageSize, total]
  );

  // const endEntry = useMemo(() => 
  //   initialPageSize || Math.min(pagination.page * pagination.pageSize, total), 
  //   [initialPageSize, pagination.page, pagination.pageSize, total]
  // );

  const startEntry = useMemo(() => 
    (pagination.page - 1) * pagination.pageSize + 1, 
    [pagination.page, pagination.pageSize]
  );

  const totalPages = useMemo(() => 
    Math.ceil(total / pagination.pageSize),
    [total, pagination.pageSize]
  );

  // const totalPages = useMemo(() =>
  //   totalPage || Math.ceil(total / pagination.pageSize),
  //   [totalPage, total, pagination.pageSize]
  // );

  const changePageSize = (size: number) => {
    setPagination(prev => ({ 
      ...prev, 
      pageSize: size, 
      page: 1 
    }));
  };

  const goToPage = (page: number) => {
    setPagination(prev => ({ 
      ...prev, 
      page: Math.max(1, Math.min(page, totalPages)) 
    }));
  };

  const resetPagination = () => {
    setPagination({ page: 1, pageSize: initialPageSize, total });
  };

  return {
    pagination,
    endEntry,
    startEntry,
    totalPages,
    changePageSize,
    goToPage,
    resetPagination,
    setPagination
  };
};
