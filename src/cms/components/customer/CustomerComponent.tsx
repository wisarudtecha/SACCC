import React, { useEffect, useState } from 'react';


// import { Modal } from '@/core/components/ui/modal';

import Button from '@/core/components/ui/button/Button';
import Input from '@/core/components/form/input/InputField';

import { CustomerProduct, useGetCustommersProductQuery } from '@/cms/store/api/custommerApi';
import Loading from '@/core/components/common/Loading';
import { Pagination } from '@/core/components/crud/Pagination';
import { useTranslation } from '@/core/hooks/useTranslation';
import { ListIcon, GridIcon } from 'lucide-react';
import CustomerView from '@/cms/components/customer/CustomerView';
import OnBackOnly from '@/cms/components/ui/pagesTemplate/onBackOnly';
import Select from '@/core/components/form/Select';
import CustomerCard from '@/cms/components/customer/CustomerCard';
import CustomerListView from '@/cms/components/customer/CustomerList';
import { userType } from '@/cms/components/customer/constant';
import CustomerCreate from '@/cms/components/customer/CustomerCreate';
import { CloseIcon } from '@/core/icons';
import { useDeleteCustommersMutationMutation } from '@/cms/store/api/custommerApi';
import ConfirmModal from '@/cms/components/crm/ConfirmModal';
import { useToast } from '@/core/hooks';

// --- Interfaces ---

interface FilterConfig {
    type?: string;
    active?: boolean;
    search: string;
}

interface PaginationConfig {
    page: number;
    pageSize: number;
}

// interface AdvanceFilterProps {
//     isOpen: boolean;
//     onClose: () => void;
//     advancedFilters: FilterConfig;
//     onApply: (filters: FilterConfig) => void;
//     onClear: () => void;
//     t: (key: string) => string;
// }

// --- Components ---

// const AdvanceFilter = React.memo(({
//     isOpen,
//     onClose,
//     onApply,
//     onClear,
//     t,
//     advancedFilters
// }: AdvanceFilterProps) => {
//     const [localFilters, setLocalFilters] = useState<FilterConfig>(advancedFilters);

//     useEffect(() => {
//         if (isOpen) {
//             setLocalFilters(advancedFilters);
//         }
//     }, [isOpen, advancedFilters]);

//     const handleApply = () => {
//         onApply(localFilters);
//     };

//     return (
//         <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
//             <h3 className="text-xl font-medium mb-4 text-gray-800 dark:text-white">
//                 {t("common.advanced_filter")}
//             </h3>
//             <div className="space-y-4">
//                 {/* Search Field */}
//                 <div>
//                     <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
//                         {t("common.search")}
//                     </label>
//                     <input
//                         className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-800 dark:text-white"
//                         value={localFilters.search}
//                         onChange={e => setLocalFilters({ ...localFilters, search: e.target.value })}
//                         placeholder={t("common.search")}
//                     />
//                 </div>

//                 {/* Status Field (Active/Inactive) */}
//                 <div>
//                     <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
//                         {t("common.status")}
//                     </label>
//                     <select
//                         className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-800 dark:text-white"
//                         value={localFilters.active === undefined ? "undefined" : String(localFilters.active)}
//                         onChange={e => {
//                             const val = e.target.value;
//                             setLocalFilters({
//                                 ...localFilters,
//                                 active: val === "true" ? true : val === "false" ? false : undefined
//                             });
//                         }}
//                     >
//                         <option value="undefined">{t("common.all")}</option>
//                         <option value="true">{t("common.active")}</option>
//                         <option value="false">{t("common.inactive")}</option>
//                     </select>
//                 </div>

//                 {/* Type Field */}
//                 <div>
//                     <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t("common.type")}</label>
//                     <select
//                         className="w-full border rounded-lg p-2 dark:bg-gray-900 dark:border-gray-800 dark:text-white"
//                         value={localFilters.type || ''}
//                         onChange={e => setLocalFilters({ ...localFilters, type: e.target.value })}
//                     >
//                         <option value="">{t("common.all")}</option>
//                         {Object.entries(userType).map(([key, value]) => (
//                             <option key={key} value={key}>
//                                 {value}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//             </div>

//             <div className="mt-6 flex justify-end gap-2">
//                 <Button variant="outline" onClick={onClear}>{t("common.clear_filters")}</Button>
//                 <Button variant="primary" onClick={handleApply}>{t("common.apply_filter")}</Button>
//             </div>
//         </Modal>
//     );
// });

const CustomerComponent: React.FC = () => {
    const { t, language } = useTranslation();
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'view'>('list');
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerProduct | null>(null);

    // --- State ---
    const [customer, setCustomer] = useState<CustomerProduct[]>([]);
    const [displayMode, setDisplayMode] = useState<'card' | 'table'>('table');
    const [searchInput, setSearchInput] = useState<string>('');
    // const [isAdvanceFilterOpen, setIsAdvanceFilterOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<CustomerProduct | null>(null);
    const { addToast } = useToast()
    const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustommersMutationMutation();

    const [pagination, setPagination] = useState<PaginationConfig>({
        page: 1,
        pageSize: 10
    });

    const [filterConfig, setFilterConfig] = useState<FilterConfig>({
        active: undefined,
        type: undefined,
        search: ''
    });

    // --- API Query ---
    const offset = (pagination.page - 1) * pagination.pageSize;
    const { data: AllCustomerData, isLoading, isFetching, error } = useGetCustommersProductQuery({
        start: offset,
        length: pagination.pageSize,
        search: filterConfig.search,
        active: filterConfig.active,
        type: filterConfig.type
    }, { refetchOnMountOrArgChange: true });

    // --- Effects ---
    useEffect(() => {
        if (AllCustomerData) {
            setCustomer(AllCustomerData.data ?? []);

            setPagination({ page: AllCustomerData?.currentPage || 1, pageSize: AllCustomerData?.pageSize || 10 });
        }
    }, [AllCustomerData]);

    // --- Handlers ---
    const handleSearch = () => {
        setFilterConfig(prev => ({ ...prev, search: searchInput }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // const handleApplyAdvancedFilters = (filters: FilterConfig) => {
    //     setFilterConfig(filters);
    //     setSearchInput(filters.search); // Sync the top search bar
    //     setPagination(prev => ({ ...prev, page: 1 }));
    //     setIsAdvanceFilterOpen(false);
    // };

    const clearFilters = () => {
        const reset = { active: undefined, search: '', type: undefined };
        setFilterConfig(reset);
        setSearchInput('');
        setPagination(prev => ({ ...prev, page: 1 }));
        // setIsAdvanceFilterOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') handleSearch();
    };

    const handleCreate = () => {
        setSelectedCustomer(null);
        setViewMode('create');
    };

    const handleEdit = (customer: CustomerProduct) => {
        setSelectedCustomer(customer);
        setViewMode('edit');
    };

    const handleView = (customer: CustomerProduct) => {
        setSelectedCustomer(customer);
        setViewMode('view');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedCustomer(null);
    };

    const handleDeleteClick = (customer: CustomerProduct) => {
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (customerToDelete) {
            try {
                await deleteCustomer({ id: customerToDelete.id }).unwrap();
                setIsDeleteModalOpen(false);
                setCustomerToDelete(null);
                addToast("success", t("common.success"));
            } catch
            // (err)
            {
                addToast("error", t("common.error"));
            }
        }
    };

    // --- Pagination Helpers ---
    const totalPages = AllCustomerData?.totalPage || 1;
    const totalCount = AllCustomerData?.totalRecords || 0;
    const startEntry = offset + 1;
    const endEntry = Math.min(offset + pagination.pageSize, totalCount);

    if (viewMode === 'create' || viewMode === 'edit') {
        return <OnBackOnly onBack={handleBackToList} >
            <CustomerCreate
                customer={viewMode === 'edit' && selectedCustomer ? selectedCustomer : undefined}
                onSuccess={handleBackToList}
            />
        </OnBackOnly>
    }

    if (viewMode === 'view' && selectedCustomer) {
        return <OnBackOnly onBack={handleBackToList}>
            <CustomerView customer={selectedCustomer} />
        </OnBackOnly>
    }

    return (
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
            <div className="mx-auto w-full">
                <div className="flex flex-col justify-between min-h-screen">
                    <div className='min-h-screen'>
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">

                                    {/* View Toggle */}
                                    <div className="flex rounded-lg overflow-hidden w-full sm:w-auto">
                                        <Button
                                            onClick={() => setDisplayMode('table')}
                                            className="rounded-r-none flex-1 sm:flex-initial"
                                            variant={`${displayMode === 'table' ? 'primary' : 'outline'}`}
                                        >
                                            <ListIcon className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={() => setDisplayMode('card')}
                                            className="rounded-l-none flex-1 sm:flex-initial"
                                            variant={`${displayMode === 'card' ? 'primary' : 'outline'}`}
                                        >
                                            <GridIcon className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Quick Search */}
                                    <Input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder={`${t("customer.searchPlaceHolder")}...`}
                                        className="w-full sm:w-64"
                                        onKeyDown={handleKeyDown}
                                    />

                                    <Button onClick={handleSearch} variant="dark" className="h-11">
                                        {t("common.search")}
                                    </Button>
                                    {/* <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t("common.type")}</label> */}
                                    <Select
                                        className="w-fit!"
                                        value={filterConfig.type || ''}
                                        onChange={(val) => setFilterConfig({ ...filterConfig, type: val })}
                                        placeholder={t("common.type")}
                                        options={Object.entries(userType).map(([key, value]) => ({
                                            value: key,
                                            label: value as string
                                        }))}
                                    />


                                    {/* <Button
                                        onClick={() => setIsAdvanceFilterOpen(true)}
                                        variant="outline"
                                        className="h-11"
                                    >
                                        {t("common.advanced_filter")}
                                    </Button> */}

                                    {/* Clear Button */}
                                    {(filterConfig.search || filterConfig.active !== undefined || filterConfig.type !== undefined) && (
                                        <Button onClick={clearFilters} className="h-11">
                                            <CloseIcon className="w-4 h-4 mr-2" />
                                            {t("common.clear_filters")}
                                        </Button>
                                    )}
                                </div>

                                {/* Create Button */}

                                <Button variant="primary" className="w-full sm:w-auto" onClick={handleCreate}>
                                    {`${t("common.add")}${language == "en" ? " " : ""}${t("common.customer")}`}
                                </Button>

                            </div>
                        </div>

                        {/* Content Area */}
                        {isFetching || isLoading ? (
                            <Loading />
                        ) : error || customer.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">{t("common.no_result")}</p>
                            </div>
                        ) : displayMode === 'card' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {customer.map((item) => (
                                    <CustomerCard
                                        key={item.id}
                                        customerData={item}
                                        onEdit={() => handleEdit(item)}
                                        onView={() => handleView(item)}
                                        onDelete={() => handleDeleteClick(item)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <CustomerListView
                                customerData={customer}
                                onEdit={handleEdit}
                                onView={handleView}
                                onDelete={handleDeleteClick}
                            />
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="mt-6">
                        <Pagination
                            pagination={{
                                page: pagination.page,
                                pageSize: pagination.pageSize,
                                total: totalCount
                            }}
                            totalPages={totalPages}
                            startEntry={startEntry}
                            endEntry={endEntry}
                            onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                            onPageSizeChange={(newPageSize) => setPagination(prev => ({
                                ...prev,
                                pageSize: Number(newPageSize),
                                page: 1
                            }))}
                        />
                    </div>
                </div>
            </div>

            {/* Advanced Filter Modal */}
            {/* <AdvanceFilter
                isOpen={isAdvanceFilterOpen}
                onClose={() => setIsAdvanceFilterOpen(false)}
                onApply={handleApplyAdvancedFilters}
                onClear={clearFilters}
                t={t}
                advancedFilters={filterConfig}
            />  */}

            {isDeleteModalOpen && customerToDelete && (
                <ConfirmModal
                    title={t("common.delete")}
                    message={`${t("common.delete")} ${customerToDelete.displayName}?`}
                    confirmLabel={t("common.delete")}
                    cancelLabel={t("common.cancel")}
                    confirmVariant="error"
                    loading={isDeleting}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    open={isDeleteModalOpen}
                />
            )}
        </div>
    );
};

export default CustomerComponent;