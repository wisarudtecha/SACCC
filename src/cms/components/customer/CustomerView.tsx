import { AppointmentCard } from "@/cms/components/appointment/AppointmentCard";
import { AppointmentForm } from "@/cms/components/appointment/AppointmentCreate";
import { CaseCard } from "@/cms/components/case/kanbanCard";
import Loading from "@/core/components/common/Loading";
import { CustomerPreviewData } from "@/cms/components/customer/CustomerPreview";
import { ContactChannelList } from "@/cms/components/customer/social/ContactChannelList";
import { useCustomerSocials } from "@/cms/hooks/useCustomerSocials";
import { getTodayDate } from "@/cms/components/date/DateToString";
import DatePickerLocal from "@/core/components/form/input/DatepicketLocal";
import { SearchableSelectApi } from "@/cms/components/SearchInput/SearchSelectInput";
import Badge from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";
import OnBackOnly from "@/cms/components/ui/pagesTemplate/onBackOnly";
import Tabs from "@/core/components/ui/tab/Tab";
import { useGetAppointmentByCustomerIdQuery } from "@/cms/store/api/appointment";
import { Case, useGetListCaseByCustomerIdQuery } from "@/cms/store/api/caseApi";
import { useCategoryListQuery } from "@/cms/store/api/category";
import { AddProductData, useAddCustomerProductMutation, useGetCustomerProductQuery, CustomerProductList } from "@/cms/store/api/customerProduct";
import { useAddCustomerServiceMutation, useGetCustomerServiceQuery } from "@/cms/store/api/customerService";
import { CustomerProduct, useGetCustomerFormConfigQuery, useGetCustomerQuery } from "@/cms/store/api/custommerApi";
import { useReadProductQuery, useGetProductSerialQuery } from "@/cms/store/api/productApi";
import { useGetServiceTypeQuery } from "@/cms/store/api/serviceType";
import { CaseEntity } from "@/cms/types/case";
import { Category } from "@/cms/types/category";
import { Product, ProductSerial } from "@/cms/types/product";
import { ServiceType } from "@/cms/types/serviceType";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDate } from "@/core/utils/crud";
import { Package, ChevronUp, Wrench, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FilePreviewCard } from "@/cms/components/Attachment/AttachmentPreviewList";
import { getFileIcon, formatFileSize } from "@/cms/components/Attachment/AttachmentConv";
import type { Customer } from "@/cms/store/api/custommerApi";

interface AddProductProps {
    language: string;
    t: (key: string) => string;
    customerId: string;
}



const AddProduct: React.FC<AddProductProps> = ({ language, t, customerId }) => {
    const [product, setProduct] = useState<AddProductData>({ productId: "", purchaseDate: "", serialNumber: "", storeId: "" })
    const [productQueryParams, setProductQueryParams] = useState({
        active: "true",
        categoryId: "",
        orderBy: language, direction: "ASC"
    });
    const [addCustomerProduct, { isLoading }] = useAddCustomerProductMutation();
    const { addToast } = useToastContext()
    const handleAdd = async () => {
        if (!product || !customerId) return;

        try {
            await addCustomerProduct({
                customerId: customerId,
                productId: product.productId,
                // storeId: product.storeId,
                serialNumber: product.serialNumber,
                purchaseDate: product.purchaseDate
            }).unwrap();

            addToast("success", t("common.success"))
            setProduct({ productId: "", serialNumber: "", purchaseDate: "", storeId: "" });

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            addToast("error", t("common.error"))
        }
    };
    return (
        <div className='p-5 space-y-3 h-screen'>
            <div className=''>
                <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("common.category")} <span className="text-red-500">*</span>
                </label>
                <SearchableSelectApi<Category>
                    value={productQueryParams.categoryId || ""}
                    apiQuery={useCategoryListQuery}
                    labelKey={language === 'th' ? "th" : "en"}
                    queryParams={{ type: "product", start: 0, length: 10, orderBy: language, direction: "ASC" }}
                    valueKey="categoryId"
                    onChange={(data) => {
                        setProductQueryParams((prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                categoryId: data
                            };
                        });
                    }}
                    enablePaginate={true}
                    placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("common.category")}`}
                />
            </div>
            <div >
                <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                    {t("common.product")} <span className="text-red-500">*</span>
                </label>
                <SearchableSelectApi<Product>
                    value={product?.productId || ""}
                    apiQuery={useReadProductQuery}
                    labelKey={language === 'th' ? "th" : "en"}
                    queryParams={productQueryParams}
                    valueKey="productId"
                    onChange={(data) => {
                        setProduct((prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                productId: data
                            };
                        });
                    }}
                    placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("common.product")}` || "Select Province"}
                    enableApiSearch={true}
                    enablePaginate={true}
                    disabled={!productQueryParams.categoryId}
                />
            </div>
            <div >
                <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("common.product_list")} <span className="text-red-500">*</span>
                </label>
                <SearchableSelectApi<ProductSerial>
                    value={product?.serialNumber || ""}
                    apiQuery={useGetProductSerialQuery}
                    labelKey={["serialNumber", language === 'th' ? "product.th" : "product.en", language === 'th' ? "store.th" : "store.en"]}
                    queryParams={productQueryParams && { productId: product.productId, orderBy: language, direction: "ASC", isBought: false }}
                    valueKey="serialNumber"
                    placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("common.product_list")}`}
                    enablePaginate={true}
                    disabled={!product.productId}
                    onChangeObject={(data) => {
                        setProduct((prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                serialNumber: data.serialNumber,
                                storeId: data.store.storeId
                            };
                        });
                    }}
                />
            </div>
            <div >
                <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("common.purchase_date")} <span className="text-red-500">*</span>
                </label>
                <DatePickerLocal
                    selected={product?.purchaseDate ? new Date(product?.purchaseDate) : null}
                    onChange={(data) => {
                        setProduct((prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                purchaseDate: data ? new Date(data).toISOString() : ""
                            };
                        });
                    }}
                    className=' normal-css-input'
                    language={language}
                    placeholderText={t("common.select_purchase_date")}
                    wrapperClassName='w-full '
                    disabled={!product.productId}
                />
            </div>

            <div className='my-3 flex items-center'>
                <Button onClick={handleAdd} disabled={isLoading} className='w-full' size='sm'>{t("common.add")}</Button>
            </div>
        </div>
    );
};

interface AddServiceProps {
    language: string;
    t: (key: string) => string;
    customerId: string;
}



const AddService: React.FC<AddServiceProps> = ({ language, t, customerId }) => {
    const [service, setService] = useState<{
        serviceId: string,
        serviceDate: string
    }>({
        serviceId: "",
        serviceDate: ""
    })
    const serviceQueryParams = () => ({
        active: "true",
        orderBy: language,
        direction: "ASC"
    });
    const [addCustomerService, { isLoading }] = useAddCustomerServiceMutation();
    const { addToast } = useToastContext()

    const handleAdd = async () => {
        if (!service || !customerId) return;

        try {

            await addCustomerService({
                customerId: customerId,
                serviceId: service.serviceId,
                serviceDate: service.serviceDate
            }).unwrap();

            addToast("success", t("common.success"))
            setService({ serviceDate: "", serviceId: "" });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            addToast("error", t("common.error"))
        }
    };

    return (
        <div className='p-5 space-y-3 h-screen'>
            <div className=''>
                <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("common.serviceType")} <span className="text-red-500">*</span>
                </label>
                <SearchableSelectApi<ServiceType>
                    value={service?.serviceId || ""}
                    apiQuery={useGetServiceTypeQuery}
                    labelKey={language === 'th' ? "th" : "en"}
                    queryParams={serviceQueryParams}
                    valueKey="serviceId"
                    searchKey='lable'
                    onChange={(data) => {
                        setService((prev) => ({
                            ...prev,
                            serviceId: data
                        }));
                    }}
                    placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("common.service")}`}
                    enableApiSearch={true}
                    enablePaginate={true}
                />
            </div>
            <div >
                <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("common.service_date")} <span className="text-red-500">*</span>
                </label>
                <DatePickerLocal
                    selected={service?.serviceDate ? new Date(service?.serviceDate) : null}
                    onChange={(data) => {
                        setService((prev) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                serviceDate: data ? new Date(data).toISOString() : ""
                            };
                        });
                    }}
                    minDate={getTodayDate()}
                    className=' normal-css-input'
                    language={language}
                    placeholderText={t("common.select_service_date")}
                    wrapperClassName='w-full '
                    disabled={!service.serviceId}
                />
            </div>
            <div className='my-3 flex items-center'>
                <Button onClick={handleAdd} disabled={isLoading} className='w-full' size='sm'>{t("common.add")}</Button>
            </div>
        </div>
    );
};

// interface AddServiceProps {
//     isOpen: boolean;
//     onClose: () => void;
//     language: string;
//     t: (key: string) => string;
//     customerId: string
// }

// const AddServiceModal: React.FC<AddServiceProps> = ({ isOpen, onClose, language, t, customerId }) => {
//     const [service, setService] = useState<string>()
//     const serviceQueryParams = useMemo(() => ({
//         customerId: customerId,
//         active: "true"
//     }), [customerId]);
//     const [addCustomerService, { isLoading }] = useAddCustomerServiceMutation();
//     const { addToast } = useToastContext()

//     const handleAdd = async () => {
//         if (!service || !customerId) return;

//         try {

//             await addCustomerService({
//                 customerId: customerId,
//                 serviceId: service
//             }).unwrap();

//             addToast("success", t("common.success"))
//             setService("");
//             onClose();
//             // eslint-disable-next-line @typescript-eslint/no-unused-vars
//         } catch (error) {
//             addToast("error", t("common.error"))
//         }
//     };

//     return (
//         <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl px-6 py-12 h-auto">
//             <div>
//                 <label className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     {t("common.service")}
//                 </label>
//                 <SearchableSelectApi<ServiceType>
//                     value={service || ""}
//                     apiQuery={useGetServiceTypeQuery}
//                     labelKey={language === 'th' ? "th" : "en"}
//                     queryParams={serviceQueryParams}
//                     valueKey="serviceId"
//                     searchKey='lable'
//                     onChange={(data) => { setService(data) }}
//                     placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("common.service")}`}
//                     enableApiSearch={true}
//                     enablePaginate={true}
//                 />
//             </div>
//             <div className='my-3 flex items-center justify-end'>
//                 <Button onClick={handleAdd} disabled={isLoading}>{t("common.confirm")}</Button>
//             </div>
//         </Modal>
//     );
// };

interface CustomerViewProps {
    customer: CustomerProduct;
}

const CustomerTab: React.FC<{ customer: CustomerProduct }> = ({ customer }) => {
    const { t, language } = useTranslation();
    const { data: serviceData, isFetching: isFetchingService } = useGetCustomerServiceQuery({
        customerId: String(customer.id),
        orderBy: `serviceDate,${language}`,
        direction: "DESC,ASC"
    }, { skip: !customer.mobileNo })

    const { data: productData, isFetching: isFetchingProduct } = useGetCustomerProductQuery({
        customerId: customer.id,
        orderBy: `purchaseDate,${language}`,
        direction: "DESC,ASC"
    }, { skip: !customer.mobileNo })

    const [cases, setCases] = useState<Case[]>([])
    const navigate = useNavigate()
    const PAGE_SIZE = 10;
    const [caseStart, setCaseStart] = useState(0)

    const [showProducts, setShowProducts] = useState(true);
    const [showServices, setShowServices] = useState(true);
    const [showCases, setShowCases] = useState(true);

    const { data: caseList, isFetching: isFetchingCase } = useGetListCaseByCustomerIdQuery({
        customerId: customer.id,
        start: caseStart,
        length: PAGE_SIZE
    }, { skip: !customer.id })

    const [hasMoreCases, setHasMoreCases] = useState(true);

    useEffect(() => {
        setCases([]);
        setCaseStart(0);
        setHasMoreCases(true);
    }, [customer.id]);

    useEffect(() => {
        if (caseList?.data) {
            const newCases = caseList.data;
            if (caseStart === 0) {
                setCases(newCases);
            } else {
                setCases(prev => {
                    const existingIds = new Set(prev.map(c => c.id || c.caseId));
                    const uniqueNewCases = newCases.filter(c => !existingIds.has(c.id || c.caseId));
                    return [...prev, ...uniqueNewCases];
                });
            }

            if (newCases.length < PAGE_SIZE) {
                setHasMoreCases(false);
            }
        }
    }, [caseList?.data, caseStart])

    const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'appointment' | 'case') => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const threshold = 50;

        if (scrollTop + clientHeight >= scrollHeight - threshold) {
            if (type === 'case') {
                if (hasMoreCases && !isFetchingCase) {
                    setCaseStart(prev => prev + PAGE_SIZE);
                }
            }
        }
    };

    return (
        <div className='min-h-screen'>{/* Section 1: Products */}
            <div className={`flex flex-col ${showProducts ? 'flex-1' : 'flex-none'} min-h-0 transition-all duration-500`}>
                <div className='flex justify-between text-gray-900 dark:text-white'>
                    <div className="flex space-x-2 items-center text-lg font-semibold text-gray-900 dark:text-white py-5 leading-relaxed line-clamp-2 xl:px-10 px-7 xl:py-7">
                        <Package className=' text-blue-500' />
                        <h3 >
                            {`${t("common.product")} (${customer.product})`}
                        </h3>
                    </div>
                    <div className='flex'>
                        <div className=' content-center cursor-pointer m-3'>
                            <ChevronUp
                                className={`w-5 h-5 transition-transform duration-300 ease-in-out ${!showProducts ? 'rotate-180' : ''}`}
                                onClick={() => setShowProducts(!showProducts)}
                            />
                        </div>
                        {/* <Button size='sm' className='m-3' onClick={() => setOnAddProduct(true)}>
                            {t("common.add")}
                        </Button> */}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-7 xl:px-10 pb-5 custom-scrollbar">
                    <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${showProducts ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                    >
                        <div className="space-y-3 max-h-125 overflow-y-auto custom-scrollbar pr-2">
                            {productData?.data && productData?.data?.length > 0 ? (
                                <>
                                    {productData.data.map((item) => (
                                        <ProductCard key={item.id} product={item} />
                                    ))}
                                    {isFetchingProduct && <Loading />}
                                </>
                            ) : (
                                <div className='text-gray-900 dark:text-white text-center py-5 w-full'>
                                    {t("common.no_result")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Services */}
            <div className={`flex flex-col ${showServices ? 'flex-1' : 'flex-none'} min-h-0 transition-all duration-500`}>
                <div className='flex justify-between text-gray-900 dark:text-white'>
                    <div className='flex space-x-2 items-center text-lg font-semibold text-gray-900 dark:text-white py-5 leading-relaxed line-clamp-2 xl:px-10 px-7 xl:py-7'>
                        <Wrench className=' text-orange-500' />
                        <h3 >
                            {`${t("common.service")} (${customer.service || "0"})`}
                        </h3>
                    </div>
                    <div className='flex'>
                        <div className=' content-center cursor-pointer m-3'>
                            <ChevronUp
                                className={`w-5 h-5 transition-transform duration-300 ease-in-out ${!showServices ? 'rotate-180' : ''
                                    }`}
                                onClick={() => setShowServices(!showServices)}
                            />
                        </div>
                        {/* <Button size='sm' className='m-3' onClick={() => setOnAddService(true)}>
                            {t("common.add")}
                        </Button> */}
                    </div>
                </div>
                <div
                    className="flex-1 overflow-y-auto  px-7 xl:px-10 pb-5 custom-scrollbar "
                >
                    <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${showServices ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        {serviceData?.data?.length != 0 ?
                            <div className="space-y-3 max-h-125 overflow-y-auto custom-scrollbar pr-2">

                                {serviceData?.data?.map((item) => (
                                    <ServiceCard key={item.id} service={item} />
                                ))}
                                {isFetchingService && <Loading />}


                            </div> :
                            <div className='text-gray-900 dark:text-white text-center'>
                                {t("common.no_result")}
                            </div>}
                    </div>
                </div>
            </div>

            {/* Section 3: Cases */}
            <div className={`flex flex-col ${showCases ? 'flex-1' : 'flex-none'} min-h-0 transition-all duration-500`}>
                <div className='flex justify-between text-gray-900 dark:text-white'>
                    <div className="flex space-x-2 items-center text-lg font-semibold text-gray-900 dark:text-white py-5 leading-relaxed line-clamp-2 xl:px-10 px-7 xl:py-7">
                        <Briefcase className=" text-amber-400" />
                        <h3>
                            {`${t("common.case")} (${cases.length})`}
                        </h3>
                    </div>
                    <div className='flex m-3'>
                        <div className=' content-center cursor-pointer'>
                            <ChevronUp
                                className={`w-5 h-5 transition-transform duration-300 ease-in-out ${!showCases ? 'rotate-180' : ''
                                    }`}
                                onClick={() => setShowCases(!showCases)}
                            />
                        </div>
                    </div>
                </div>
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${showCases ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    {cases.length != 0 ?
                        <div className="overflow-hidden">
                            <div
                                className="sm:grid-cols-3 grid gap-3 px-7 xl:px-10 pb-5 custom-scrollbar max-h-125 overflow-y-auto"
                                onScroll={(e) => handleScroll(e, 'case')}
                            >
                                {cases.map((item, idx) => (
                                    <CaseCard
                                        key={item.id || idx}
                                        caseItem={item as CaseEntity}
                                        language={language}
                                        className={"not-dark:bg-gray-100"}
                                        handleCaseClick={(selectedCase) => navigate("/cms/case/" + selectedCase.caseId)}
                                    />
                                ))}
                                {isFetchingCase && <Loading />}

                            </div>
                        </div>
                        : <div className='text-gray-900 dark:text-white text-center'>{t("common.no_result")}</div>}
                </div>
            </div>
            {/* <AddProductModal
                isOpen={onAddProduct}
                onClose={() => { setOnAddProduct(false) }}
                language={language}
                t={t}
                customerId={customer.id}
            /> */}
            {/* <AddServiceModal
                isOpen={onAddService}
                onClose={() => { setOnAddService(false) }}
                language={language}
                t={t}
                customerId={customer.id}
            /> */}
        </div>
    );
};

const AppointmentTab: React.FC<{ customerId: string }> = ({ customerId }) => {
    const { data: appointment, isFetching } = useGetAppointmentByCustomerIdQuery({
        id: customerId,
        // customerId: customerId
    })
    const [isAddAppointment, setIsAddAppointment] = useState(false);
    if (isFetching) return <Loading className="p-10" />;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { t } = useTranslation();
    if (isAddAppointment) {
        return <OnBackOnly onBack={() => setIsAddAppointment(false)} >
            <AppointmentForm customerId={customerId} onSuccessBack={() => { setIsAddAppointment(false) }} />
        </OnBackOnly>
    }
    return (
        <div className='min-h-screen text-gray-900 dark:text-white mx-5'>
            <div className=' flex justify-between'>
                <label>{t("common.appointment")}</label>
                <Button onClick={() => { setIsAddAppointment(true) }}>
                    {t("common.schedule")}
                </Button>
            </div>
            {appointment?.data?.length != 0 ?
                <div className="flex-1 mx-3 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto py-3 custom-scrollbar">
                    {appointment?.data?.map((item) => (
                        <AppointmentCard
                            key={item.appointmentId}
                            appointmentData={item}
                            showCaseId={true}
                            showCustomer={false}
                            showAppointmentUser={true}
                        />
                    ))}
                </div> :
                <div className=' text-center'>
                    {t("common.no_result")}
                </div>}
        </div>
    );
};

/**
 * The customer's contact channels — phone, email, and every linked LINE / Facebook /
 * Text Chat / extra-phone / extra-email row — as their own tab.
 *
 * Previously this rendered inside the fixed left sidebar (`CustomerPreviewData`), under a
 * "Contact Information" heading. Moved here so it gets a full-width panel instead of being
 * squeezed into the narrow sidebar column; the data wiring (form-config gating on
 * mobileNo/email, `useCustomerSocials` for the linked rows) is unchanged from before the
 * move. `hideHeading` is passed because this tab's own label in the tab strip already
 * names the section — `ContactChannelList`'s internal heading would just duplicate it.
 *
 * Read-only, same as it was in the sidebar: editing (add/edit/unlink) lives separately in
 * `SocialAccountManager`, used from the case side panel.
 */
const ContactChannelsTab: React.FC<{ customer: Customer | undefined }> = ({ customer }) => {
    const { data: formConfigRes } = useGetCustomerFormConfigQuery();
    const formConfig = formConfigRes?.data;
    const { socials, isLoading, isPartial } = useCustomerSocials({ customerId: customer?.id });

    return (
        <div className="p-5">
            <ContactChannelList
                customer={customer}
                socials={socials}
                isLoading={isLoading}
                isPartial={isPartial}
                hideHeading
                showPhone={formConfig?.mobileNo !== false}
                showEmail={formConfig?.email !== false}
            />
        </div>
    );
};


export const ServiceCard: React.FC<{ service: ServiceType }> = ({
    service
}) => {
    const { t, language } = useTranslation();
    return <div
        key={service.id}
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors`}
    >
        <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
                {/* <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2  rounded-full flex-shrink-0`}></div>
                    
                </div> */}
                <div className=" flex justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-2 transition-colors">
                        {service[language == "th" ? "th" : "en"]}
                    </h4>
                </div>
                <div className='grid grid-cols-2 text-sm space-x-3 font-semibold text-blue-600 dark:text-blue-400 break-all'>
                    <div>
                        <h3>{t("common.service_date")}</h3>
                        <h4 className=" text-gray-900 dark:text-white">
                            {formatDate(service.serviceDate, { includeTime: false })}
                        </h4>
                    </div>
                    <div>
                        <h3>{t("common.labor_price")}</h3>
                        <h4 className=" text-gray-900 dark:text-white">
                            {service.price + " " + t('common.baht')}
                        </h4>
                    </div>
                </div>


            </div>
        </div>
    </div>
}

export const ProductCard: React.FC<{ product: CustomerProductList }> = ({
    product
}) => {
    const { t, language } = useTranslation();
    const haveWarranty = product.endWarrantyDate && new Date(product.endWarrantyDate) > new Date();
    return <div
        key={product.id}
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors   group`}
    >
        <div className="flex items-start justify-between space-x-3">
            <FilePreviewCard
                file={{
                    attUrl: product.product.image || "",
                    attName: product.product[language === 'th' ? 'th' : 'en'],
                    attId: product.productId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                disabled={true}
                className="w-18! h-18!"
                wrapperClassName="!p-0 !h-fit"
            />
            <div className="flex-1 min-w-0">
                {/* <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2  rounded-full flex-shrink-0`}></div>
                    
                </div> */}
                <div className=" flex justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-2  transition-colors">
                        {product.product[language == "th" ? "th" : "en"]}
                    </h4>
                    <Badge color={haveWarranty ? "success" : "error"} variant="solid" className="font-normal text-sm"> {haveWarranty ? t("customerProduct.haveWarranty") : t("customerProduct.endOfWarranty")}</Badge>
                </div>
                <div className='grid grid-cols-3 text-sm space-x-3  text-blue-600 dark:text-blue-400 break-all'>
                    <div>
                        <h3 className="">{t("common.serial_number")}</h3>
                        <h4 className="text-gray-900 dark:text-white ">
                            {product.serialNumber}
                        </h4>
                    </div>
                    <div>
                        <h3 className="">{t("common.purchase_date")}</h3>
                        <h4 className="text-gray-900 dark:text-white">
                            {formatDate(product.purchaseDate, { includeTime: false })}
                        </h4>
                    </div>
                    <div>
                        <h3 className="">{t("common.end_warranty")}</h3>
                        <h4 className="text-gray-900 dark:text-white">
                            {formatDate(product.endWarrantyDate, { includeTime: false })}
                        </h4>
                    </div>
                </div>
            </div>
        </div>
    </div>
}


const CustomerView: React.FC<CustomerViewProps> = ({ customer }) => {
    const { t, language } = useTranslation();
    const { data: customerData, isFetching: isFetchingCustomer } = useGetCustomerQuery(customer.id);
    const [dataOfCustomer, setDataOfCustomer] = useState<Customer | null>(null);
    
    useEffect(() => {
        if (customerData?.data) {
            setDataOfCustomer(customerData?.data);
        }
    }, [customerData]);

    return (
        <div className=" min-h-screen rounded-2xl border border-gray-200 bg-white   dark:border-gray-800 dark:bg-white/3  ">
            <h3 className="items-center text-lg font-semibold text-gray-900 dark:text-white py-5 leading-relaxed line-clamp-2 xl:px-10 px-7 xl:py-7">
                {t("customer.info")}
            </h3>
            {dataOfCustomer?.id && (
                <div className="overflow-x-auto custom-scrollbar border-t   border-gray-200  dark:border-gray-800 grid sm:grid-cols-[1fr_4fr]">
                    {isFetchingCustomer ? <Loading /> : <CustomerPreviewData customer={dataOfCustomer || customerData?.data} />}
                    <div className="overflow-hidden flex flex-col h-fit  min-h-screen">
                        <Tabs
                            items={[
                                { id: "customer", label: t("common.customer"), content: <CustomerTab customer={customer} /> },
                                { id: "assignment", label: t("common.appointment"), content: <AppointmentTab customerId={dataOfCustomer?.id || customer.id} /> },
                                { id: "addProduct", label: t("common.add_product"), content: <AddProduct t={t} language={language} customerId={dataOfCustomer?.id || customer.id} /> },
                                { id: "addService", label: t("common.add_service"), content: <AddService t={t} language={language} customerId={dataOfCustomer?.id || customer.id} /> },
                                { id: "contactChannels", label: t("customer.social.channels"), content: <ContactChannelsTab customer={dataOfCustomer || customerData?.data} /> }
                            ]}
                            defaultTab="customer"
                            className="flex flex-col h-full"
                            variant='underline'
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerView;
