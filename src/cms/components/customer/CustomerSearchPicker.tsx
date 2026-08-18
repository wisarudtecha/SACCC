// src/cms/components/customer/CustomerSearchPicker.tsx
import React, { useEffect, useState } from "react";
import { Pagination } from "@/core/components/crud/Pagination";
import { useTranslation } from "@/core/hooks/useTranslation";
import { CloseIcon } from "@/core/icons";
import Loading from "@/core/components/common/Loading";
import Input from "@/core/components/form/input/InputField";
import Select from "@/core/components/form/Select";
import Button from "@/core/components/ui/button/Button";
import { userType } from "@/cms/components/customer/constant";
import { CustomerProduct, useGetCustommersProductQuery } from "@/cms/store/api/custommerApi";
import CustomerListView from "@/cms/components/customer/CustomerList";

export interface FilterConfig {
  search: string;
  active?: boolean;
  type?: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
}

interface CustomerSearchPickerProps {
  /** Called with the row the agent chose. */
  onSelect: (customer: CustomerProduct) => void;
}

/**
 * Search the customer directory and pick one.
 *
 * Extracted from `LinkingExistingCustomer` so the two "find a customer" flows share it:
 * linking a customer to a *case*, and linking a social identity to a *customer*. They are
 * different operations over the same search, and duplicating this block is how the two
 * would drift apart.
 *
 * Selection only — what happens to the chosen customer is entirely the caller's business.
 */
export const CustomerSearchPicker: React.FC<CustomerSearchPickerProps> = ({ onSelect }) => {
  const { t } = useTranslation();

  const [customer, setCustomer] = useState<CustomerProduct[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    search: "",
    active: undefined,
    type: undefined
  });

  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10
  });

  const offset = (pagination.page - 1) * pagination.pageSize;

  const {
    data: AllCustomerData,
    isLoading,
    isFetching,
    error
  } = useGetCustommersProductQuery({
    start: offset,
    length: pagination.pageSize,
    search: filterConfig.search,
    active: filterConfig.active,
    type: filterConfig.type
  }, {
    refetchOnMountOrArgChange: true
  });

  useEffect(() => {
    if (AllCustomerData) {
      setCustomer(AllCustomerData.data ?? []);
    }
  }, [AllCustomerData]);

  const handleSearch = () => {
    setFilterConfig(prev => ({
      ...prev,
      search: searchInput
    }));
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const clearFilters = () => {
    setFilterConfig({
      search: "",
      active: undefined,
      type: undefined
    });
    setSearchInput("");
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const startEntry = offset + 1;
  const totalCount = AllCustomerData?.totalRecords || 0;
  const totalPages = AllCustomerData?.totalPage || 1;
  const endEntry = Math.min(offset + pagination.pageSize, totalCount);

  return (
    <div className="bg-white px-0 py-0 dark:border-gray-800 dark:bg-white/3">
      <div className="mx-auto w-full">
        <div className="flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex flex-col lg:flex-row gap-2 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 w-full lg:w-auto">
                <Input
                  type="text"
                  className="w-full sm:w-64"
                  placeholder={`${t("customer.searchPlaceHolder")}...`}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <Button
                  className="h-11"
                  variant="dark"
                  onClick={handleSearch}
                >
                  {t("common.search")}
                </Button>

                <Select
                  className="w-fit!"
                  options={Object.entries(userType).map(([key, value]) => ({
                    label: value as string,
                    value: key
                  }))}
                  placeholder={t("common.type")}
                  value={filterConfig.type || ""}
                  onChange={val => setFilterConfig({
                    ...filterConfig,
                    type: val
                  })}
                />

                {(filterConfig.search || filterConfig.active !== undefined || filterConfig.type !== undefined) && (
                  <Button
                    className="h-11"
                    onClick={clearFilters}
                  >
                    <CloseIcon className="w-4 h-4 mr-2" />
                    {t("common.clear_filters")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isFetching || isLoading ? (
            <Loading />
          ) : error || customer.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-lg">{t("common.no_result")}</p>
            </div>
          ) : (
            <CustomerListView
              customerData={customer}
              onLink={onSelect}
            />
          )}

          <div className="my-0">
            <Pagination
              endEntry={endEntry}
              pagination={{
                page: pagination.page,
                pageSize: pagination.pageSize,
                total: totalCount
              }}
              startEntry={startEntry}
              totalPages={totalPages}
              onPageChange={newPage => setPagination(prev => ({
                ...prev,
                page: newPage
              }))}
              onPageSizeChange={newPageSize => setPagination(prev => ({
                ...prev,
                page: 1,
                pageSize: Number(newPageSize)
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSearchPicker;
