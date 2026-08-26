

// const userType = [{ name: "Bronze", id: "1" }, { name: "Silver", id: "2" }, { name: "Gold", id: "3" }, { name: "Platinum", id: "4" }]

import MetricsCard from "@/core/components/admin/MetricsCard";
import { AppointmentCard } from "@/cms/components/appointment/AppointmentCard";
import AssignOfficerModal from "@/cms/components/assignOfficer/singleAssignOfficer";
import { COMMON_INPUT_CSS } from "@/cms/components/case/constants/caseConstants";
import { CaseCard } from "@/cms/components/case/kanbanCard";
import { i18nUserType } from "@/cms/components/customer/constant";
import { CustomerPreviewData } from "@/cms/components/customer/CustomerPreview";
import { ProductCard, ServiceCard } from "@/cms/components/customer/CustomerView";
import { getTodayDate } from "@/cms/components/date/DateToString";
import DatePickerLocal from "@/core/components/form/input/DatepicketLocal";
import { getPriorityBorderColorClass, getPriorityColorClass } from "@/cms/components/function/Prioriy";
import { idbStorage } from "@/cms/components/idb/idb";
import { SearchableSelectApi } from "@/cms/components/SearchInput/SearchSelectInput";
import Avatar from "@/core/components/ui/avatar/Avatar";
import Badge from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog/dialog";
import { statusIdToStatusTitle } from "@/cms/components/ui/status/status";
import Tabs, { TabItem } from "@/core/components/ui/tab/Tab";
import { useInsertAppointmentMutationMutation, useGetAppointmentByCustomerIdQuery, useGetAppointmentStatusCountQuery } from "@/cms/store/api/appointment";
import { useGetAppointmentTypeQuery } from "@/cms/store/api/appointmentType";
import { Case, useGetListCaseByCustomerIdQuery, usePatchUpdateCaseCustomerMutation } from "@/cms/store/api/caseApi";
import { useGetCustomerProductQuery } from "@/cms/store/api/customerProduct";
import { useGetCustomerServiceQuery } from "@/cms/store/api/customerService";
import {
    Customer,
    useGetCustomerQuery,
    useGetCustommerByPhoneNoQuery,
} from "@/cms/store/api/custommerApi";
import { useGetDeviceIoTQuery } from "@/cms/store/api/deviceIoT";
import { useGetServiceTypeQuery } from "@/cms/store/api/serviceType";
import { Appointment, AppointmentInsert } from "@/cms/types/appointment";
import { CaseEntity } from "@/cms/types/case";
import { Device } from "@/cms/types/deviceIoT";
import { CaseSop, DeviceMetaData, Unit } from "@/cms/types/dispatch";
import Loading from "@/core/components/common/Loading";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useToast } from "@/core/hooks";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePiiMasker } from "@/core/hooks/useMaskedValue";
import { formatDate } from "@/core/utils/crud";
import { BookOpen, CheckLineIcon, ClockFading, Cpu, Edit, Ellipsis, ExternalLink, Hash, MessageCircle, Plus, Tag, X, Search } from "lucide-react";
import React, { useState, useCallback, useEffect } from "react";
import { isValidPhoneNumber } from "react-phone-number-input";
import { useNavigate } from "react-router-dom";
import CustomerCreate from "@/cms/components/customer/CustomerCreate";
import { CustomerProduct } from "@/cms/store/api/custommerApi";
import { CaseDetails } from "@/cms/types/case";
import LinkingExistingCustomer from "@/cms/components/case/LinkingExistingCustomer";
import { NoteManager } from "@/cms/components/customer/notes/NoteManager";
import { SocialAccountManager } from "@/cms/components/customer/social/SocialAccountManager";
import { LinkSocialAccount } from "@/cms/components/customer/social/LinkSocialAccount";
import { ConfirmationModal } from "@/cms/components/case/modal/ConfirmationModal";
import type { Custommer } from "@/cms/types";
import KbSectionCard from "@/kms/components/dashboard/KbSectionCard/index";
import { KbTabCardList } from "@/kms/components/card-kb-tab";

const AddAppointment: React.FC<{ caseId: string, customerId: string, caseData: CaseSop | undefined }> = React.memo(({ caseId, customerId, caseData }) => {
    const [isAddCustomer, setIsAddCustomer] = useState<boolean>(false)
    const [showAssignModal, setShowAssignModal] = useState<boolean>(false)
    const { t, language } = useTranslation();
    const [appointment, setAppointment] = useState<AppointmentInsert>({
        appointmentDate: "",
        serviceId: "",
        appointmentTypeId: "",
        note: "",
        customerId: customerId,
        caseId: caseId,
        units: []
    })
    const { addToast } = useToastContext()
    const PAGE_SIZE = 10;
    const [start, setStart] = useState(0);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [hasMore, setHasMore] = useState(true);

    const [AddAppointment, { isLoading }] = useInsertAppointmentMutationMutation()
    const { data: appointmentDateList, isLoading: LoadingAppointment, isFetching } = useGetAppointmentByCustomerIdQuery({
        id: customerId,
        // customerId: customerId,
        start: start,
        length: PAGE_SIZE,
        // done:false,
    }, { skip: !customerId })

    const { data: statusCountData } = useGetAppointmentStatusCountQuery(customerId, { skip: !customerId })

    useEffect(() => {
        setAppointments([]);
        setStart(0);
        setHasMore(true);
    }, [customerId]);

    useEffect(() => {
        if (appointmentDateList?.data) {
            const newData = appointmentDateList.data;
            if (start === 0) {
                setAppointments(newData);
            } else {
                setAppointments(prev => {
                    const existingIds = new Set(prev.map(item => item.id));
                    const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
                    return [...prev, ...uniqueNewData];
                });
            }
            if (newData.length < PAGE_SIZE) {
                setHasMore(false);
            }
        }
    }, [appointmentDateList?.data, start]);


    const [assignedOfficers, setAssignedOfficers] = useState<Unit[]>([]);

    const handleAddAppointment = async () => {
        try {

            if (!appointment.appointmentTypeId || !appointment.serviceId || !appointment.customerId) {
                addToast("error", t("common.error"))
                return
            }

            const result = await AddAppointment(appointment).unwrap() // ✅ Use unwrap for better error handling

            if (result?.msg?.toLowerCase() === "success") {
                addToast("success", t("common.success"))

                setAppointment({
                    appointmentDate: new Date().toISOString(),
                    serviceId: "",
                    appointmentTypeId: "",
                    note: "",
                    customerId: "",
                    caseId: caseId,
                    units: []
                })
                setIsAddCustomer(false)
            } else {
                addToast("error", t("common.error"))
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            addToast("error", t("common.error"))
        }
    }
    const handleAssignOfficers = useCallback(async (selectedOfficers: Unit[]) => {
        if (selectedOfficers.length > 0) {
            const newUnits = selectedOfficers.map(officer => ({
                unitId: officer.unitId,
                userOwner: officer.username
            }));

            setAppointment((prev) => ({
                ...prev,
                units: newUnits
            }));
            setAssignedOfficers(selectedOfficers);
        }
        setShowAssignModal(false);
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 50 && hasMore && !isFetching && !LoadingAppointment) {
            setStart(prev => prev + PAGE_SIZE);
        }
    };

    const appointmentInfo = {
        pending: statusCountData?.data?.find(item => item.statusId === "A001")?.count || 0,
        confirm: statusCountData?.data?.find(item => item.statusId === "A002")?.count || 0,
    };

    const attrMetrics = [
        { key: "pending", title: t("appointment.upcoming"), icon: ClockFading, color: "yellow", className: "text-yellow-600" },
        { key: "confirm", title: t("common.confirm"), icon: CheckLineIcon, color: "green", className: "text-green-600" },
    ];

    return (
        <div>
            {isAddCustomer ? <div className=" space-y-2 text-gray-500 dark:text-gray-200 font-medium text-sm">
                <div >
                    {t("common.appointmentType")}
                </div>
                <SearchableSelectApi value={appointment?.appointmentTypeId || ""} onChange={(data) => {
                    setAppointment((prev) => ({
                        ...prev,
                        appointmentTypeId: data
                    }))
                }} apiQuery={useGetAppointmentTypeQuery} labelKey={language == "th" ? "th" : "en"} valueKey={"appointmentTypeId"} placeholder={t("case.panel.serviceType_search")} />
                <div >
                    {t("common.serviceType")}
                </div>
                <SearchableSelectApi value={appointment.serviceId || ""} onChange={(data) => {
                    setAppointment((prev) => ({
                        ...prev,
                        serviceId: data
                    }))
                }} apiQuery={useGetServiceTypeQuery} labelKey={language == "th" ? "th" : "en"} valueKey={"serviceId"} placeholder={t("case.panel.appointmentType_search")} />
                {/* <div >
                    {t("common.customer")}
                </div>
                <SearchableSelectApi value={appointment.customerNumber} onChange={(data) => {
                    setAppointment((prev) => ({
                        ...prev,
                        customerNumber: data
                    }))
                }} apiQuery={useGetCustommersQuery} labelKey={"displayName"} valueKey={"mobileNo"} placeholder={t("case.panel.customer_search")} /> */}
                <div >
                    {t("common.appointDate")}
                </div>
                <DatePickerLocal
                    selected={appointment.appointmentDate ? new Date(appointment.appointmentDate) : null}
                    onChange={(date: Date | null) => {
                        setAppointment((prev) => ({
                            ...prev,
                            appointmentDate: date?.toISOString() || ""
                        }))
                    }}
                    language={language}
                    showTimeSelect
                    dateFormat="Pp"
                    minDate={getTodayDate()}
                    popperClassName="z-50"
                    wrapperClassName="w-full"
                    className={`p-2 w-full dark:[&::-webkit-calendar-picker-indicator]:invert ${COMMON_INPUT_CSS}`}
                    placeholderText={t("case.display.schedule_placeholder_time")}
                    locale={language === 'th' ? 'th' : 'en'}
                />
                <div >
                    {t("common.note")}
                </div>
                <textarea className={COMMON_INPUT_CSS} onChange={(e) => {
                    setAppointment((prev) => ({
                        ...prev,
                        note: e.target.value
                    }))
                }}> </textarea>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-gray-500 dark:text-gray-200 font-medium text-sm">
                            {t("case.assign_officer_modal.assign_button")}
                        </label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAssignModal(true)}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            {t("common.select")}
                        </Button>
                    </div>

                    {/* Display selected units/officers */}
                    <div className="flex flex-wrap gap-2">
                        {assignedOfficers.length > 0 && (
                            assignedOfficers.map((officer) => (
                                <Badge key={officer.unitId} className="flex items-center gap-1">
                                    {officer.unitName}
                                    <X
                                        className="w-3 h-3 cursor-pointer"
                                        onClick={() => {
                                            setAssignedOfficers(prev => prev.filter(o => o.unitId !== officer.unitId));
                                            setAppointment(prev => ({
                                                ...prev,
                                                units: prev.units?.filter(u => u.unitId !== officer.unitId)
                                            }));
                                        }}
                                    />
                                </Badge>
                            ))
                        )}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button className="w-full" onClick={handleAddAppointment}
                        disabled={isLoading}>
                        {t("common.add")}
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setIsAddCustomer(false)}>
                        {t("common.cancel")}
                    </Button>
                </div>
            </div>
                : <div className=" space-y-3">
                    {customerId && <Button className="w-full bg-blue-400! dark:bg-blue-500" size="xs" onClick={() => setIsAddCustomer(true)} >
                        <Plus className="w-4 h-4 mr-1" />
                        {t("common.add")}
                    </Button>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {attrMetrics.map((metric) => (
                            <MetricsCard
                                key={metric.key}
                                title={metric.title}
                                value={appointmentInfo[metric.key as keyof typeof appointmentInfo]}
                                icon={<metric.icon className={metric.className} />}
                                color={metric.color}
                                className="mb-1!"
                            />
                        ))}
                    </div>
                    {LoadingAppointment && start === 0 ? (
                        <Loading />
                    ) : (
                        <div
                            className="flex flex-col gap-3 overflow-y-auto max-h-[55vh] custom-scrollbar pr-1"
                            onScroll={handleScroll}
                        >
                            {appointments.map((item) => (
                                <AppointmentCard
                                    key={item.id}
                                    appointmentData={item}
                                    showCustomer={false}
                                    showAppointmentUser={true}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-white"></AppointmentCard>
                            ))}
                            {isFetching && <Loading />}
                        </div>
                    )}

                </div>
            }
            <AssignOfficerModal
                open={showAssignModal}
                onOpenChange={setShowAssignModal}
                caseId={caseId || ""}
                caseData={caseData}
                onAssign={handleAssignOfficers}
                assignedOfficers={assignedOfficers}
                sopUnitLists={caseData?.unitLists || []}
            />
        </div>
    );
});

/**
 * The customer's contact channels.
 *
 * Until now this drew a fixed four-row list in which LINE and Facebook were the literal
 * string "-" and the Primary/verified badges were hardcoded — a placeholder, not data, in
 * the same way the Internal Notes tab was before v0.34.0. It now reads real linked
 * accounts and lets them be managed in place.
 */
const CustomerProfileTab: React.FC<{ customer: Customer }> = ({ customer }) => (
    <SocialAccountManager customer={customer} />
);

const CustomerProductTab: React.FC<{ customer: Customer }> = ({ customer }) => {
    const { t } = useTranslation();
    const { data: productData, isLoading, isFetching } = useGetCustomerProductQuery({
        customerId: customer.id,
        orderBy: "purchaseDate,en",
        direction: "DESC,ASC"
    });

    if (isLoading || isFetching) {
        return (
            <div className="py-5">
                <Loading />
            </div>
        );
    }

    if (!productData?.data || productData.data.length === 0) {
        return (
            <div className="text-gray-900 dark:text-white text-center py-5">
                {t("common.no_result")}
            </div>
        );
    }

    return (
        <div className="overflow-hidden space-y-3">
            {productData.data.map((item) => (
                <ProductCard key={item.id} product={item} />
            ))}
        </div>
    );
};

const CustomerServiceTab: React.FC<{ customer: Customer }> = ({ customer }) => {
    const { t } = useTranslation();
    const { data: serviceData, isLoading, isFetching } = useGetCustomerServiceQuery({
        customerId: String(customer.id),
    });

    if (isLoading || isFetching) {
        return (
            <div className="py-5">
                <Loading />
            </div>
        );
    }

    if (!serviceData?.data || serviceData.data.length === 0) {
        return (
            <div className="text-gray-900 dark:text-white text-center py-5">
                {t("common.no_result")}
            </div>
        );
    }

    return (
        <div className="overflow-hidden space-y-3">
            {serviceData.data.map((item) => (
                <ServiceCard key={item.id} service={item} />
            ))}
        </div>
    );
};

const CustomerHistoryTab: React.FC<{ customer: Customer | undefined }> = ({ customer }) => {
    const [cases, setCases] = useState<Case[]>([])
    const PAGE_SIZE = 10;
    const [caseStart, setCaseStart] = useState(0)
    const { data: caseList, isFetching: isFetchingCase, isLoading } = useGetListCaseByCustomerIdQuery({
        customerId: customer?.id || "",
        start: caseStart,
        length: PAGE_SIZE
    }, { skip: !customer?.id })

    const [hasMoreCases, setHasMoreCases] = useState(true);
    const navigate = useNavigate()
    useEffect(() => {
        setCases([]);
        setCaseStart(0);
        setHasMoreCases(true);
    }, [customer?.id]);

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

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 50 && hasMoreCases && !isFetchingCase && !isLoading) {
            setCaseStart(prev => prev + PAGE_SIZE);
        }
    };

    const { t, language } = useTranslation();

    return <div className="text-gray-900 dark:text-white">
        {cases.length != 0 ?
            <div
                className="flex flex-col gap-3 pb-5 overflow-y-auto custom-scrollbar pr-2 max-h-[55vh]"
                onScroll={handleScroll}
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
                {(isFetchingCase || isLoading) && <Loading />}
            </div>
            : isFetchingCase || isLoading ? <Loading />
                : <div className='text-gray-900 dark:text-white text-center'>{t("common.no_result")}</div>}
    </div>

}

const CustomerInfoTab: React.FC<{
    customer: Customer | undefined,
    caseData?: CaseSop | undefined,
    caseWorkOrderNumber?: string,
    customerNumber?: string,
    setCaseState?: React.Dispatch<React.SetStateAction<CaseDetails | undefined>>,
    hideCustomerLinkActions?: boolean,
    isCreate?: boolean
}> = ({
    customer,
    caseData,
    caseWorkOrderNumber,
    customerNumber,
    setCaseState,
    hideCustomerLinkActions,
    isCreate
}) => {
    const { language, t } = useTranslation();
    const { canViewField, maskValue } = usePiiMasker();
    const [openCustomerModal, setOpenCustomerModal] = useState<boolean>(false);
    const [openLinkCustomerModal, setOpenLinkCustomerModal] = useState<boolean>(false);
    const [openCustomerFormModal, setOpenCustomerFormModal] = useState<boolean>(false);
    const [openUnlinkConfirm, setOpenUnlinkConfirm] = useState<boolean>(false);
    const [openLinkSocialModal, setOpenLinkSocialModal] = useState<boolean>(false);
    const [updateCaseCustomer] = usePatchUpdateCaseCustomerMutation();
    const { addToast } = useToastContext();

    /**
     * A social account was just attached to a customer. Point the case at that customer
     * too — an agent who has identified who the LINE conversation belongs to has, in the
     * same breath, identified the case's customer.
     *
     * Only the id is set: the panel's own `useGetCustomerQuery` loads the rest from it, so
     * there is no second copy of the profile-merge rules to keep in step here.
     */
    const handleSocialLinked = useCallback(async (linkedCustomerId: string) => {
        if (caseWorkOrderNumber) {
            try {
                await updateCaseCustomer({ id: caseWorkOrderNumber, customerId: Number(linkedCustomerId) }).unwrap();
            } catch (error) {
                console.error("Failed to link customer to case after social link:", error);
                addToast("error", t("common.error"));
                return;
            }
        }

        setCaseState?.(prev => prev ? {
            ...prev,
            customerData: { ...prev.customerData, id: linkedCustomerId } as Custommer,
        } : prev);
    }, [caseWorkOrderNumber, updateCaseCustomer, addToast, t, setCaseState]);

    const handleUnlink = useCallback(async () => {
        if (caseWorkOrderNumber) {
            try {
                await updateCaseCustomer({ id: caseWorkOrderNumber, customerId: null }).unwrap();
            } catch (error) {
                console.error("Failed to unlink customer from case:", error);
                addToast("error", t("common.error"));
                return;
            }
        }
        // Drop identity, keep the case's contact number - same rule as everywhere else.
        setCaseState?.(prev => prev ? {
            ...prev,
            customerData: { mobileNo: prev.customerData?.mobileNo } as Custommer,
        } : prev);
    }, [caseWorkOrderNumber, updateCaseCustomer, addToast, t, setCaseState]);

    const tabs = [
        customer && { id: "profile", label: t("common.profile"), content: <CustomerProfileTab customer={customer} /> },
        { id: "history", label: t("common.history"), content: <CustomerHistoryTab customer={customer} /> },
        customer && { id: "note", label: t("customer.note.title"), content: <NoteManager customerId={customer.id} /> },
        { id: "Appointment", label: t("common.appointment"), content: <AddAppointment caseId={caseWorkOrderNumber || ""} customerId={customer?.id || ""} caseData={caseData} /> },
        customer && { id: "product", label: t("common.product"), content: <CustomerProductTab customer={customer} /> },
        customer && { id: "service", label: t("common.service"), content: <CustomerServiceTab customer={customer} /> },
    ] as TabItem[];

    return <div>
        <div className="p-3 space-y-3 rounded-2xl m-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            <div className="flex items-center space-x-2">
                <span className="text-blue-500 dark:text-blue-400 font-medium text-sm">
                    {t("customer.info")}
                </span>
            </div>
            <div className="flex items-center space-x-3">
                <div className="flex flex-wrap gap-3 items-center">
                    <Avatar
                        src={
                            canViewField("photo") && customer?.photo
                                ? customer.photo
                                : "/images/user/unknow user.png"
                        }
                        size="xxlarge"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                            {customer?.firstName && customer?.lastName ? customer?.firstName + " " + customer.lastName : "-"}
                        </h3>
                        {/* {customerData && (
                                                <>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        Business ID: 123456789
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Level: Premium
                                                    </div>
                                                </>
                                            )} */}
                    </div>
                </div>
            </div>
            <div className="space-y-2 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                        <div className="text-blue-500 dark:text-blue-400 mb-1">{t("common.dob")}</div>
                        <div className="text-gray-900 dark:text-white">
                            {/* Masked *instead of* formatted, never after: the mask is a fixed
                                `••/••/1990` string, and handing that to a date formatter
                                produces "Invalid Date". */}
                            {!customer?.dob
                                ? "-"
                                : canViewField("dob")
                                    ? formatDate(customer.dob, { includeTime: false, })
                                    : maskValue("dob", customer.dob)}
                        </div>
                    </div>
                    <div>
                        <div className="text-blue-500 dark:text-blue-400 mb-1">{t("common.email")}</div>
                        <div className="text-gray-900 dark:text-white">
                            {customer?.email ? maskValue("email", customer.email) : "-"}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                        <div className="text-blue-500 dark:text-blue-400 mb-1">{t("common.phoneNumber")}</div>
                        <div className="text-gray-900 dark:text-white">
                            {customer?.mobileNo ? maskValue("mobileNo", customer.mobileNo) : "-"}
                        </div>
                    </div>
                    <div>
                        <div className="text-blue-500 dark:text-blue-400 mb-1">{t("common.customer_grade")}</div>
                        <div className="text-gray-900 dark:text-white">
                            {i18nUserType(t, customer?.userType || "")}
                        </div>
                    </div>
                </div>
                {/* <div>
                    <div className="text-blue-500 dark:text-blue-400 mb-1">{t("common.address")}</div>
                    <div className="text-gray-900 dark:text-white">
                        {customer?.address ? mergeAddress(customer.address) : "-"}
                    </div>
                </div> */}
            </div>
            {/* Service History Section */}
            {/* <div className={`flex md:flex flex-1 flex-col`}>
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t("case.panel.service_history")}</h3>
                    <Button variant="ghost" size="sm" className="p-1 text-xs">{t("case.assignment.advance_filter")}</Button>
                </div>
            </div>
            <ScrollArea className="flex-1">
                    <div className="p-3 space-y-3">
                        {customer?.displayName ? serviceHistory.map((historyItem) => (
                            <div
                                key={historyItem.id}
                                className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer border-l-4 ${getPriorityBorderColorClass(historyItem.priority)} group`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className={`w-2 h-2 ${getPriorityColorClass(historyItem.priority)} rounded-full shrink-0`}></div>
                                            <span className="text-xs text-gray-600 dark:text-gray-500 font-mono">#{historyItem.id}</span>
                                            <span className="text-xs text-gray-600 dark:text-gray-500">{historyItem.date}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                            {historyItem.title}
                                        </h4>
                                        <div className="flex items-center justify-between">
                                            <Badge>
                                                {historyItem.status}
                                            </Badge>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                {Array.isArray(historyItem.assignee)
                                                    ? historyItem.assignee.map((a: { name: string }) => a.name).join(", ")
                                                    : ((historyItem.assignee as { name?: string })?.name || "-")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : <></>}
                    </div>
                </ScrollArea>
        </div> */}
        </div>

        {customer != undefined && ((Array.isArray(customer) && customer.length > 0) || (!Array.isArray(customer) && Object.keys(customer).length > 0)) && (
            <>
                <div className="m-3 space-y-2">
                    <Button size="xs" onClick={() => { setOpenCustomerModal(true) }} className=" w-full bg-white dark:bg-gray-800 text-gray-900! dark:text-white!  rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        <h3 className="text-sm font-medium ">View Full Profile</h3>
                    </Button>
                    {!hideCustomerLinkActions && (
                        <div className="flex gap-3">
                            <Button
                                size="xs"
                                onClick={() => setOpenCustomerFormModal(true)}
                                className="flex-1 bg-white dark:bg-gray-800 text-gray-900! dark:text-white! rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                {t("common.edit")}
                            </Button>
                            <Button
                                size="xs"
                                onClick={() => setOpenLinkCustomerModal(true)}
                                className="flex-1 bg-white dark:bg-gray-800 text-gray-900! dark:text-white! rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Search className="w-4 h-4 mr-1" />
                                {t("common.change")}
                            </Button>
                            <Button
                                size="xs"
                                onClick={() => setOpenUnlinkConfirm(true)}
                                className="flex-1 bg-white dark:bg-gray-800 text-gray-900! dark:text-white! rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-4 h-4 mr-1" />
                                {t("common.unlink")}
                            </Button>
                        </div>
                    )}
                </div>

                <Tabs
                    items={tabs}
                    variant="case"
                    defaultTab={"profile"}
                    classContent="p-3 overflow-y-auto custom-scrollbar"
                    classTab="overflow-auto custom-scrollbar py-1"
                />
            </>
        ) || (!hideCustomerLinkActions && (
            <div className="xl:flex gap-3 m-3">
                <Button
                    size="xs"
                    onClick={() => setOpenLinkCustomerModal(true)}
                    className=" w-full bg-white dark:bg-gray-800 text-gray-900! dark:text-white! rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-3"
                >
                    <Search className="w-4 h-4 mr-1" />
                    <h3 className="text-sm font-medium ">{t("common.linked_existing")}</h3>
                </Button>

                <Button
                    size="xs"
                    onClick={() => setOpenCustomerFormModal(true)}
                    className=" w-full bg-white dark:bg-gray-800 text-gray-900! dark:text-white! rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-3"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    <h3 className="text-sm font-medium ">{t("common.add")}{language === "en" && " "}{t("common.customer")}</h3>
                </Button>

                {/*
                    The inbound direction: a LINE or Facebook conversation has arrived and the
                    person behind it is unknown. Start from the account and find its owner,
                    rather than searching a directory that has no idea what a LINE id is.
                */}
                <Button
                    size="xs"
                    onClick={() => setOpenLinkSocialModal(true)}
                    className=" w-full bg-white dark:bg-gray-800 text-gray-900! dark:text-white! rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-3"
                >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <h3 className="text-sm font-medium ">{t("customer.social.link_title")}</h3>
                </Button>
            </div>
        ))}

        <Dialog
            open={openLinkSocialModal}
            onOpenChange={() => setOpenLinkSocialModal(false)}
        >
            <DialogContent
                aria-describedby={undefined}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-7xl w-[95vw] flex flex-col z-999999 rounded-md h-[85vh] overflow-y-scroll"
            >
                <DialogHeader>
                    <DialogTitle>{t("customer.social.link_title")}</DialogTitle>
                </DialogHeader>

                <LinkSocialAccount
                    onLinked={handleSocialLinked}
                    onClose={() => setOpenLinkSocialModal(false)}
                />
            </DialogContent>
        </Dialog>

        {/* <Modal
            isOpen={openCustomerModal}
            onClose={() => { setOpenCustomerModal(false) }}
            children={<CustomerPreviewData customer={customer} />}
            className="fixed inset-0 bg-white dark:bg-black/70 flex items-center justify-center z-9999"
        
        /> */}
        <Dialog open={openCustomerModal} onOpenChange={() => { setOpenCustomerModal(false) }}>
            <DialogContent aria-describedby={undefined} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-7xl w-[95vw] h-[85vh] flex flex-col z-999999 rounded-md">
                <DialogHeader>
                    <DialogTitle>
                    </DialogTitle>
                </DialogHeader>
                <CustomerPreviewData customer={customer} className=" overflow-auto custom-scrollbar" />
            </DialogContent>
        </Dialog>

        <Dialog
            open={openLinkCustomerModal}
            onOpenChange={() => setOpenLinkCustomerModal(false)}
        >
            <DialogContent
                aria-describedby={undefined}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-7xl w-[95vw] flex flex-col z-999999 rounded-md h-[85vh] overflow-y-scroll"
            >
                <DialogHeader>
                    <DialogTitle>{t("common.linked_existing")}</DialogTitle>
                </DialogHeader>

                <LinkingExistingCustomer
                    caseWorkOrderNumber={caseWorkOrderNumber}
                    setCaseState={setCaseState}
                    setOpenLinkCustomerModal={() => setOpenLinkCustomerModal(false)}
                    isCreate={isCreate}
                />
            </DialogContent>
        </Dialog>

        <Dialog
            open={openCustomerFormModal}
            onOpenChange={() => setOpenCustomerFormModal(false)}
        >
            <DialogContent
                aria-describedby={undefined}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white max-w-7xl w-[95vw] flex flex-col z-999999 rounded-md"
            >
                <DialogHeader>
                    <DialogTitle>
                        {customer ? t("common.edit") : `${t("common.add")}${language === "en" ? " " : ""}${t("common.customer")}`}
                    </DialogTitle>
                </DialogHeader>

                <CustomerCreate
                    customer={customer as unknown as CustomerProduct}
                    customerNumber={customerNumber as string}
                    minimal={true as boolean}
                    setOpenAddCustomerModal={() => setOpenCustomerFormModal(false)}
                    setCaseState={setCaseState}
                    caseWorkOrderNumber={caseWorkOrderNumber}
                    isCreate={isCreate}
                />
            </DialogContent>
        </Dialog>

        <ConfirmationModal
            isOpen={openUnlinkConfirm}
            onClose={() => setOpenUnlinkConfirm(false)}
            onConfirm={handleUnlink}
            title={`${t("common.unlink")} ${t("common.customer")}`}
            description={t("case.panel.unlink_confirm_description")}
            confirmButtonVariant="error"
        />
    </div>
}

const SubCaseTab: React.FC<{ referCaseList?: string[]; }> = ({ referCaseList }) => {
    const [referCase, setReferCase] = useState<CaseEntity[]>([]);
    const navigate = useNavigate()

    useEffect(() => {
        if (!referCaseList) return;

        const fetchData = async () => {
            try {
                const caseList = await idbStorage.getItem("caseList");
                if (caseList) {
                    setReferCase(
                        (caseList as CaseEntity[]).filter((caseItem: CaseEntity) =>
                            referCaseList.includes(caseItem.caseId)
                        )
                    );
                }
            } catch (error) {
                console.error("Failed to get caseList:", error);
            }
        };

        fetchData();
    }, [referCaseList]);

    return <div className="space-y-3">
        {referCase.length > 0 ? (
            referCase.map((SupCase) => (
                <div
                    key={SupCase.caseId}
                    onClick={() => navigate(`/case/${SupCase.caseId}`)}
                    className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer border-l-4 ${getPriorityBorderColorClass(SupCase.priority)} group`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className={`w-2 h-2 ${getPriorityColorClass(SupCase.priority)} rounded-full shrink-0`}></div>
                                <span className="text-xs text-gray-600 dark:text-gray-500 font-mono">#{SupCase.caseId}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-500">
                                    {new Date(SupCase.createdDate).toLocaleDateString()}
                                </span>
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                {SupCase.caseDetail || 'No details available'}
                            </h4>
                            <div className="flex items-center justify-between">
                                <Badge>
                                    {statusIdToStatusTitle(SupCase.statusId)}
                                </Badge>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {SupCase.createdBy}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center text-gray-500 py-4">
                No subcases found
            </div>
        )}
    </div>
}

const DeviceInfoTab: React.FC<{ deviceMetaData?: DeviceMetaData }> = ({ deviceMetaData }) => {
    const { t } = useTranslation();

    return <div className="p-3">
        <div className="flex items-center space-x-2">
            <span className="text-blue-500 dark:text-blue-400 font-medium text-sm">
                {t("case.panel.device_info")}
            </span>
        </div>

        <div className="space-y-2 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className=" col-span-2">
                    <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 space-x-1">
                        <span>{t("case.panel.iot_device_name")}</span>
                    </div>
                    <div className="text-gray-900 dark:text-white">
                        {deviceMetaData?.device_name || "-"}
                    </div>
                </div>
                {/* <div className=" col-span-2">
                                                <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 space-x-1">
                                                    <Hash className="w-3 h-3" />
                                                    <span>{t("case.panel.iot_device_serial_number")}</span>
                                                </div>
                                                <div className="text-gray-900 dark:text-white">
                                                    {deviceMetaData?.device_serial_number || "-"}
                                                </div>
                                            </div> */}
                <div>
                    {/* <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 space-x-1">
                                                    <Wifi className="w-3 h-3" />
                                                    <span>{t("case.display.iot_device")}</span>
                                                </div>
                                                <div className="text-gray-900 dark:text-white">
                                                    {deviceMetaData?.device_id || caseItem?.iotDevice || "-"}
                                                </div> */}
                    <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 space-x-1">
                        <Hash className="w-3 h-3" />
                        <span>{t("case.panel.iot_device_serial_number")}</span>
                    </div>
                    <div className="text-gray-900 dark:text-white">
                        {deviceMetaData?.device_serial_number || "-"}
                    </div>
                </div>
                <div>
                    <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 space-x-1">
                        <Cpu className="w-3 h-3" />
                        <span>{t("case.panel.device_type")}</span>
                    </div>
                    <div className="text-gray-900 dark:text-white">
                        {deviceMetaData?.device_type || "-"}
                    </div>
                </div>

                <div>
                    <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{t("case.panel.brand")}</span>
                    </div>
                    <div className="text-gray-900 dark:text-white">
                        {deviceMetaData?.device_brand || "-"}
                        <span>{!deviceMetaData?.device_brand || ` ${t("case.panel.device_model")} `}</span>
                        {deviceMetaData?.device_brand ? deviceMetaData?.device_model : ""}
                    </div>
                </div>
            </div>

        </div>
    </div>
}

type PanelTabId = "Device info" | "customer-info" | "Appointment" | "Subcase";

interface Tab {
    id: PanelTabId,
    label: string;
    content: React.ReactNode;
}

interface PanelProps {
    deviceMetaData?: DeviceMetaData;
    caseWorkOrderNumber?: string;
    customerNumber?: string;
    customerId?: string;
    referCaseList?: string[];
    iotDevice?: string;
    onClose: () => void;
    caseData?: CaseSop | undefined
    className?: string
    defaultTab?: PanelTabId,
    disabledTabs?: PanelTabId[];
    setCaseState?: React.Dispatch<React.SetStateAction<CaseDetails | undefined>>;
    hideCustomerLinkActions?: boolean;
    isCreate?: boolean;
}

const Panel: React.FC<PanelProps> = ({
    referCaseList, caseData,
    caseWorkOrderNumber, deviceMetaData, iotDevice, className,
    customerId, customerNumber, defaultTab = "customer-info", disabledTabs,
    setCaseState, hideCustomerLinkActions, isCreate
}) => {


    // const [device, setDevice] = useState<Device>()

    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<string>(defaultTab);



    const [customer, setCustomer] = useState<Customer | undefined>(undefined);

    const isPhoneValid = customerNumber ? isValidPhoneNumber(customerNumber, "TH") : false;

    // customerId (set by "Link existing customer" / "Add new customer") is the authoritative
    // source once known - the case's phone number field may legitimately not match it (the
    // whole point of those two actions). Only fall back to a phone-based lookup when no
    // customer has been linked yet. 
    const {
        data: customerDataByPhone,
        isFetching: isFetchingByPhone,
        error: errorByPhone
    } = useGetCustommerByPhoneNoQuery(
        {
            id: customerNumber || "",
        },
        {
            skip: !!customerId || !customerNumber || !isPhoneValid || (activeTab !== "customer-info" && activeTab !== "Appointment"),
            refetchOnMountOrArgChange: true
        }
    );

    const {
        data: customerDataById,
        isFetching: isFetchingById,
        error: errorById
    } = useGetCustomerQuery(customerId || "", {
        skip: !customerId || (activeTab !== "customer-info" && activeTab !== "Appointment"),
        refetchOnMountOrArgChange: true
    });

    const isFetchingCustomer = isFetchingByPhone || isFetchingById;
    const customerError = errorByPhone || errorById;
    const customerData = customerId ? customerDataById : customerDataByPhone;

    const { toasts, removeToast } = useToast();

    useEffect(() => {
        if (customerError || (!customerNumber && !customerId) || (!customerId && customerNumber && !isPhoneValid)) {
            setCustomer(undefined)
        } else {
            setCustomer(customerData?.data)
        }
        // // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerData, customerError, customerId, customerNumber, isPhoneValid])



    const tabs = [
        {
            id: "customer-info",
            label: t("common.info"),
            content: isFetchingCustomer
                ? <Loading />
                : <CustomerInfoTab
                    customer={customer}
                    caseData={caseData}
                    caseWorkOrderNumber={caseWorkOrderNumber}
                    customerNumber={customerNumber}
                    setCaseState={setCaseState}
                    hideCustomerLinkActions={hideCustomerLinkActions}
                    isCreate={isCreate}
                />
        },
        { id: "Device info", label: t("case.panel.device_info"), content: <DeviceInfoTab deviceMetaData={deviceMetaData} /> },
        { id: "SubCase", label: t("common.subcase"), content: <SubCaseTab referCaseList={referCaseList} /> },
        {
            id: "Copilot", label: "Copilot", content: <></>, icons: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.447 8.97458C13.2919 8.97458 13.1447 9.03927 13.0397 9.15215L8.05192 7.322L11.8225 6.92387C11.9087 7.06008 12.0564 7.14082 12.2204 7.14082C12.4805 7.14082 12.6919 6.93117 12.6919 6.67333C12.6919 6.4155 12.4805 6.20585 12.2204 6.20585C12.0215 6.20585 11.8455 6.328 11.7781 6.51181L8.03419 6.90731L12.6037 4.13808C12.6988 4.20694 12.8141 4.24473 12.9306 4.24473C13.235 4.24473 13.483 3.99881 13.483 3.69699C13.483 3.39516 13.2355 3.14925 12.9306 3.14925C12.6257 3.14925 12.3781 3.39516 12.3781 3.69699C12.3781 3.7265 12.3807 3.75549 12.3855 3.78449L7.81486 6.55427L9.84608 3.45626C9.8644 3.45833 9.88318 3.45936 9.90144 3.45936C10.1615 3.45936 10.373 3.24969 10.373 2.99186C10.373 2.73404 10.1615 2.52437 9.90144 2.52437C9.64139 2.52437 9.42993 2.73404 9.42993 2.99186C9.42993 3.07574 9.45292 3.15753 9.49626 3.23001L7.45506 6.34305L8.11195 1.07633C8.35322 1.01265 8.51976 0.797796 8.51976 0.547741C8.51976 0.245914 8.27225 0 7.96734 0C7.66237 0 7.41487 0.245914 7.41487 0.547741C7.41487 0.747577 7.52243 0.929297 7.69737 1.02507L7.0441 6.26226L5.86822 2.83862C5.95589 2.75113 6.00553 2.63205 6.00553 2.50884C6.00553 2.25102 5.79404 2.04135 5.534 2.04135C5.27396 2.04135 5.06248 2.25102 5.06248 2.50884C5.06248 2.74181 5.24106 2.94216 5.47238 2.97219L6.65146 6.40564L2.99258 2.69263C3.02234 2.62429 3.03801 2.54922 3.03801 2.47467C3.03801 2.17284 2.78997 1.92693 2.48555 1.92693C2.18112 1.92693 1.93308 2.17284 1.93308 2.47467C1.93308 2.7765 2.18112 3.02241 2.48555 3.02241C2.55604 3.02241 2.62758 3.00843 2.69337 2.98203L6.35851 6.70075L2.95446 5.45152C2.92991 5.21544 2.72679 5.03269 2.48555 5.03269C2.2255 5.03269 2.01402 5.24236 2.01402 5.50019C2.01402 5.75801 2.2255 5.96767 2.48555 5.96767C2.60721 5.96767 2.72157 5.92212 2.80929 5.83981L6.2363 7.09736L1.0386 7.64662C0.943046 7.46853 0.758199 7.35875 0.55246 7.35875C0.248033 7.35875 0 7.60416 0 7.9065C0 8.20884 0.24751 8.45425 0.55246 8.45425C0.801016 8.45425 1.01667 8.29272 1.08299 8.05875L6.23216 7.51462L3.14662 9.38461C3.07142 9.33695 2.98475 9.3121 2.89493 9.3121C2.63489 9.3121 2.42341 9.52181 2.42341 9.77958C2.42341 10.0374 2.63489 10.2471 2.89493 10.2471C3.15498 10.2471 3.36645 10.0374 3.36645 9.77958C3.36645 9.76564 3.36593 9.75164 3.36436 9.73764L6.46036 7.86147L3.58002 12.2543C3.54608 12.2475 3.51109 12.2445 3.47663 12.2445C3.17221 12.2445 2.92417 12.4903 2.92417 12.7921C2.92417 13.094 3.17221 13.3399 3.47663 13.3399C3.78106 13.3399 4.02909 13.094 4.02909 12.7921C4.02909 12.6824 3.99411 12.5722 3.9304 12.4805L6.81905 8.07532L6.36113 11.7479C6.17155 11.8127 6.0452 11.9877 6.0452 12.189C6.0452 12.4469 6.25666 12.6565 6.51671 12.6565C6.77676 12.6565 6.98828 12.4469 6.98828 12.189C6.98828 12.0296 6.90941 11.8851 6.77571 11.7987L7.23631 8.10477L8.93124 13.0397C8.81014 13.1437 8.74119 13.2934 8.74119 13.4523C8.74119 13.7541 8.98922 14 9.29367 14C9.59805 14 9.84608 13.7541 9.84608 13.4523C9.84608 13.2934 9.77614 13.1421 9.65446 13.0381C9.56311 12.9599 9.44714 12.9133 9.32657 12.9061L7.64254 8.00333L10.2247 10.6235C10.2069 10.6732 10.1981 10.726 10.1981 10.7782C10.1981 11.0361 10.4095 11.2458 10.6696 11.2458C10.9296 11.2458 11.1411 11.0361 11.1411 10.7782C11.1411 10.5205 10.9296 10.3108 10.6696 10.3108C10.6205 10.3108 10.5709 10.3185 10.5239 10.3341L7.95585 7.72841L12.8956 9.54094C12.9056 9.83447 13.1494 10.07 13.4475 10.07C13.7457 10.07 14 9.82415 14 9.52227C14 9.22046 13.752 8.97458 13.447 8.97458Z" fill="#667085" />
            </svg>
        },
        {
            id: "KB", label: "KB", content: 
            <KbSectionCard
                    title={t("knowledge.case.panel.title")}
                    description=""
                >
                    <KbTabCardList />
             </KbSectionCard>
            , icons: <BookOpen />
        },
        {
            id: "More", label: "More", content: <></>, icons: <Ellipsis />
        }
    ].filter((tab) => {
        if (tab.id === "customer-info" && import.meta.env.VITE_SHOW_CASE_CONTRACT !== "true") return false;
        if (tab.id === "Appointment" && !caseWorkOrderNumber) return false;
        if (tab.id === "SubCase" && !!referCaseList) return false;
        if (disabledTabs?.includes(tab.id as PanelTabId)) return false;
        return true;
    }) as Tab[];



    // const addTab = [
    //     // { id: "customer-info", label: "Info" },
    //     { id: "Device info", label: "Device info" },
    //     // { id: "Location", label: "Location" },
    //     // { id: "Knowledge Base", label: "Knowledge Base" },
    //     // { id: "FAQ", label: "FAQ" },
    // ];
    // const serviceHistory = CaseHistory;

    const cachedDevices = localStorage.getItem("devices");

    const { data: deviceResponse } = useGetDeviceIoTQuery(
        { start: 0, length: 100 },
        { skip: cachedDevices !== null }
    );

    useEffect(() => {
        if (deviceResponse?.data) {
            localStorage.setItem("devices", JSON.stringify(deviceResponse.data));
        }
    }, [deviceResponse?.data]);


    const deviceList = cachedDevices ? JSON.parse(cachedDevices) as Device[] : deviceResponse?.data;

    useEffect(() => {
        const matchDevice = deviceList?.find((device) => {
            return device.deviceId === iotDevice
        })
        if (matchDevice) {
            // setDevice(matchDevice)
        } else {
            // setDevice(undefined)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iotDevice])


    return (
        <div className={`w-full h-full bg-gray-50 dark:bg-gray-900 flex flex-col ${className}`}>
            <Tabs
                items={tabs}
                variant="case"
                defaultTab={defaultTab}
                currentTab={setActiveTab}
                classContent="!pt-0 overflow-y-auto custom-scrollbar"
            />

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
};

export default Panel