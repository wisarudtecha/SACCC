// /src/components/workflow/list/List.tsx
import
React,
{
  useEffect,
  useMemo,
  useState
}
  from 'react';
import Input from "@/core/components/form/input/InputField";
import Button from "@/core/components/ui/button/Button";
import {
  CloseIcon,
  GridIcon,
  ListIcon,
} from "@/core/icons";
import OnBackOnly from "@/cms/components/ui/pagesTemplate/onBackOnly"
import FormCard from './formCard';

import { FormManager } from '../interface/FormField';
import DynamicForm from '../form/dynamic-form/DynamicForm';
import { useGetAllFormslinkWfQuery, useGetFormByFormIdMutation, useUpdateStatusMutation } from '@/cms/store/api/formApi';
import ListViewFormManager from './ListView';
import FormVersionsModal from './formVersionModal';
import { useTranslation } from '@/core/hooks/useTranslation';
import { Pagination } from '@/core/components/crud/Pagination';
import Loading, { LoadingModal } from '@/core/components/common/Loading';
import { usePermissions } from '@/core/hooks';
import { useToastContext } from '@/core/components/crud/ToastGlobal';


interface SortConfig {
  key: keyof FormManager | null;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  status?: boolean;
  isDraft?: boolean;
  category: string;
  search: string;
}

interface PaginationConfig {
  page: number;
  pageSize: number;
}













const FormManagerComponent: React.FC = () => {
  const [showDynamicForm, setShowDynamicForm] = useState<boolean>(false);
  const [dynamicEditFormAction, setDynamicEditFormAction] = useState<boolean>(false);
  const [dynamicEditDataFormAction, setDynamicEditDataFormAction] = useState<boolean>(false);
  const [forms, setForms] = useState<FormManager[]>([]);
  const [SelectForm, setSelectForm] = useState<FormManager | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10
  });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    isDraft: undefined,
    status: undefined,
    category: '',
    search: ''
  });
  const offset = (pagination.page - 1) * pagination.pageSize;
  const { data: AllFormsData, isLoading, isFetching, error } = useGetAllFormslinkWfQuery({ start: offset, length: pagination.pageSize, search: filterConfig.search }
    , { refetchOnMountOrArgChange: true }
  );

  const [displayMode, setDisplayMode] = useState<'card' | 'table'>('card');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [getFormById] = useGetFormByFormIdMutation()
  const { addToast } = useToastContext();
  const [updateFormStatus] = useUpdateStatusMutation();
  const [searchInput, setSearchInput] = useState<string>('');
  // const filterOptions = [
  //   { value: "active", label: "Active", status: true },
  //   { value: "inactive", label: "Inactive", status: false },
  //   { value: "draft", label: "Draft", isDraft: true },
  // ];
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false)
  const handleOnEdit = async (form: FormManager) => {
    const formEdit = form.versionsInfoList?.find((item) => item.publish === false)
    try {
      setLoading(true)

      const resultForm = await getFormById({ formId: form.formId, version: formEdit?.version ? formEdit.version : form.versions }).unwrap()
      if (resultForm.data)
        setSelectForm({ ...form, formColSpan: resultForm.data.formColSpan, formFieldJson: resultForm.data.formFieldJson, formType:resultForm.data.formType })
    } catch
    // (error) 
    {
      addToast("error", t("common.error"))
      return
    } finally {
      setLoading(false)
    }
    setDynamicEditFormAction(true)
    setDynamicEditDataFormAction(true)
    setShowDynamicForm(true)
  }

  const handleOnView = async (form: FormManager) => {

    try {
      setLoading(true)
      const resultForm = await getFormById({ formId: form.formId, version: form.versions }).unwrap()
      if (resultForm.data)
        setSelectForm({ ...form, formColSpan: resultForm.data.formColSpan, formFieldJson: resultForm.data.formFieldJson })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      addToast("error", t("common.error"))
      return
    } finally {
      setLoading(false)
    }



    setDynamicEditFormAction(false)
    setDynamicEditDataFormAction(false)
    setShowDynamicForm(true)
  }
  const handleOnCreate = () => {
    setSelectForm(undefined)
    setDynamicEditFormAction(true)
    setDynamicEditDataFormAction(true)
    setShowDynamicForm(true)
  }
  const onBack = () => {
    setSelectForm(undefined)
    setShowDynamicForm(false)
  }

  useEffect(() => {
    const loadFormManagers = async () => {
      try {

        setError(null);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        AllFormsData && setForms(AllFormsData.data ?? []);
      }
      catch (err) {
        setError('Failed to fetch forms. Please try again.');
        console.error('Error fetching forms:', err);
      }
    };

    loadFormManagers();
  }, [AllFormsData]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await getFormLinkWf(null);
  //       if (response?.data?.data) {
  //         setSelectFormLinkWf(response.data.data);
  //       }
  //     } catch (error) {
  //       addToast('error', `${error}`);
  //     }
  //   };

  //   fetchData();
  // }, [SelectForm]);



  // Handle search
  const handleSearch = () => {
    setFilterConfig(prev => ({ ...prev, search: searchInput }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle sort
  const handleSort = (key: keyof FormManager) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle filter


  // Clear filters
  const clearFilters = () => {
    setFilterConfig({ category: '', search: '', status: undefined, isDraft: undefined });
    setSearchInput('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handles status update for a form
  const handleUpdateStatus = async (
    formId: string,
    formName: string,
    newStatus: FormManager['active']
  ) => {
    try {
      const response = await updateFormStatus({
        formId,
        active: newStatus,
      }).unwrap();

      if (response?.msg === "Success") {
        setForms(prev =>
          prev.map(f =>
            f.formId === formId
              ? { ...f, active: newStatus }
              : f
          )
        );
        addToast(
          'success',
          `Form "${formName}" has been set to ${newStatus ? "Active" : "Inactive"}.`
        );
      } else {
        addToast(
          'error',
          response?.data?.msg || `Failed to update status for "${formName}".`
        );
      }
    } catch (err) {
      addToast(
        'error',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Failed to update status for "${formName}". ${(err as any)?.message || err}`
      );
    }
  };


  const displayedForms = useMemo(() => {
    // eslint-disable-next-line prefer-const
    let sorted = [...forms];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key!] ?? '';
        const bValue = b[sortConfig.key!] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [forms, sortConfig]);

  const totalPages = AllFormsData?.totalPage || 1;
  const totalCount = AllFormsData?.totalRecords || 0;
  const startEntry = offset + 1;
  const endEntry = Math.min(offset + pagination.pageSize, offset + forms.length);

  const { t } = useTranslation();

  const permissions = usePermissions();
  const onSetStatusInactive = async (formId: string, formName: string, newStatus: FormManager['active']) => {

    handleUpdateStatus(formId, formName, newStatus)

  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleOnVersion = (form: FormManager) => {
    setSelectForm(form)
    setShowVersionModal(true)
  }




  if (showDynamicForm) {
    return <OnBackOnly onBack={onBack}>
      <div className='rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12'>
        <DynamicForm initialForm={SelectForm} edit={dynamicEditFormAction} editFormData={dynamicEditDataFormAction}  >
        </DynamicForm>
      </div>
    </OnBackOnly>
  }
  return (
    <>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          {SelectForm && <FormVersionsModal isOpen={showVersionModal} onClose={() => {
            setShowVersionModal(false)
            setSelectForm(undefined)
          }} form={SelectForm} />}


          <div className="p-0">
            <div className="mx-auto">
              {/* Header */}
              <div className="mb-8">
                {/* Controls */}
                {/* Controls */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  {/* Search Section */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                    {/* Display Mode Toggle */}
                    <div className="flex rounded-lg overflow-hidden w-full sm:w-auto">
                      <Button
                        onClick={() => setDisplayMode('card')}
                        className="rounded-r-none flex-1 sm:flex-initial"
                        variant={`${displayMode === 'card' ? 'primary' : 'outline'}`}
                      >
                        <GridIcon className="w-4 h-4 mr-2 sm:mr-0" />
                        <span className="sm:hidden">Card</span>
                      </Button>
                      <Button
                        onClick={() => setDisplayMode('table')}
                        className="rounded-l-none flex-1 sm:flex-initial"
                        variant={`${displayMode === 'table' ? 'primary' : 'outline'}`}
                      >
                        <ListIcon className="w-4 h-4 mr-2 sm:mr-0" />
                        <span className="sm:hidden">Table</span>
                      </Button>
                    </div>

                    {/* Search Input - Full width on mobile */}
                    <Input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder={`${t("common.search")}...`}
                      className="w-full sm:w-64 md:w-80"
                      onKeyDown={handleKeyDown}
                    />

                    <Button
                      onClick={handleSearch}
                      variant="dark"
                      className="h-11 w-full sm:w-auto"
                    >
                      {t("common.search")}
                    </Button>

                    {(filterConfig.search || filterConfig.status != undefined || filterConfig.isDraft != undefined) && (
                      <Button
                        onClick={clearFilters}
                        className="h-11 w-full sm:w-auto"
                      >
                        <CloseIcon className="w-4 h-4 mr-2" />
                        {t("common.clear_filters")}
                      </Button>
                    )}
                  </div>

                  {/* Create Button */}
                  {permissions.hasPermission("form.create") &&
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <Button
                        onClick={handleOnCreate}
                        variant="primary"
                        className="w-full sm:w-auto"
                      >
                        {t("form_builder.create")}
                      </Button>
                    </div>
                  }
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mt-4">

                  {/* <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select
                      value={
                        filterConfig.status === true
                          ? "active"
                          : filterConfig.status === false
                            ? "inactive"
                            : filterConfig.isDraft === true
                              ? "draft"
                              : ""
                      }
                      onChange={(value) => handleFilter('status', value)}
                      options={filterOptions}
                      placeholder="Select Status"
                      className="w-full"
                    />
                  </div> */}

                  {/* Category Filter */}
                  {/* <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select
                      value={filterConfig.category}
                      onChange={(value) => handleFilter('category', value)}
                      options={getUniqueCategoriesOptions}
                      placeholder="Select Category"
                      className="w-full"
                    />
                  </div> */}

                  {/* Clear Filters */}

                </div>
              </div>

              {/* Results Info */}
              {/* <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
                
              </div> */}

              {/* Content */}
              {isFetching || isLoading ? <Loading /> : error ?
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">{isLoading ? t("common.loading") + "..." : t("form_builder.form_not_found")}</div>
                  <p className="text-gray-400 dark:text-gray-500 mb-4">
                    {filterConfig.search || filterConfig.status || filterConfig.category
                      ? t("form_builder.desc_filter_not_found")
                      : ''
                    }
                  </p>

                </div>
                : displayMode === 'card' ? (
                  /* Card View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {displayedForms.map((form) => (
                      <FormCard
                        key={form.formId}
                        form={form}
                        setForms={setForms}
                        handleOnEdit={() => handleOnEdit(form)}
                        handleOnView={() => handleOnView(form)}
                        onSetStatusInactive={onSetStatusInactive}
                        handleOnVersion={handleOnVersion}
                      />
                    ))}
                  </div>
                ) : (
                  /* Table View */
                  <ListViewFormManager
                    forms={displayedForms}
                    handleSort={handleSort}
                    sortConfig={sortConfig}
                    setForms={setForms}
                    onSetStatusInactive={onSetStatusInactive}
                    handleOnEdit={handleOnEdit}
                    handleOnView={handleOnView}
                    handleOnVersion={handleOnVersion}
                  />
                )}

              {/* Pagination */}
              {/* Pagination */}
              <div className="mt-6">
                <Pagination
                  pagination={{
                    page: error ? 1 : pagination.page,
                    pageSize: error ? 1 : pagination.pageSize,
                    total: error ? 1 : Number(totalCount)
                  }}
                  totalPages={error ? 1 : Number(totalPages)}
                  startEntry={error ? 1 : startEntry}
                  endEntry={error ? 1 : endEntry}
                  onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                  onPageSizeChange={(newPageSize) => setPagination(prev => ({
                    ...prev,
                    pageSize: Number(newPageSize),
                    page: 1
                  }))}
                />
              </div>

              {/* No Results */}
              {/* {displayedForms.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">{isLoading ? t("common.loading") + "..." : t("form_builder.form_not_found")}</div>
                  <p className="text-gray-400 dark:text-gray-500 mb-4">
                    {filterConfig.search || filterConfig.status || filterConfig.category
                      ? t("form_builder.desc_filter_not_found")
                      : ''
                    }
                  </p>
                  {(filterConfig.search || filterConfig.status || filterConfig.category) && (
                    <Button
                      onClick={clearFilters}
                      className="h-11"
                      variant="primary"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )} */}
            </div>
          </div>
          {/* <ConfirmationModal
            isOpen={showPubModal}
            onClose={() => {
              setSelectForm(undefined)
              setShowPubModal(false)
            }}
            onConfirm={() => {
              SelectForm && handleOnPubUnPub(SelectForm)
              setSelectForm(undefined)
            }}
            title={SelectForm?.publish ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            description={SelectForm?.publish ? "คุณต้องการที่จะเปิดใช้งานฟอร์มนี้ใช่ไหม" : "คุณต้องการที่จะปิดใช้งานฟอร์มนี้ใช่ไหม"}

            confirmButtonVariant="error"

          /> */}
        </div>
        {loading &&
          <LoadingModal />
        }
      </div>
    </>
  );
};

export default FormManagerComponent;