import React, { useEffect, useState } from "react";
import DatePickerLocal from "@/core/components/form/input/DatepicketLocal";
import { getTodayDate } from "../date/DateToString";
import { COMMON_INPUT_CSS } from "../case/constants/caseConstants";
import { SearchableSelectApi } from "../SearchInput/SearchSelectInput";
import Button from "@/core/components/ui/button/Button";
import { Eye } from "lucide-react";
import { Modal } from "@/core/components/ui/modal";
import { CustomerPreviewData } from "../customer/CustomerPreview";
import { useInsertAppointmentMutationMutation, useUpdateAppointmentMutation } from "@/cms/store/api/appointment";
import { useGetAppointmentTypeQuery } from "@/cms/store/api/appointmentType";
import { AppointmentType } from "@/cms/types/appointmentType";
import { useGetCustomerQuery, Customer, useGetCustommersQuery } from "@/cms/store/api/custommerApi";
import { useGetServiceTypeQuery } from "@/cms/store/api/serviceType";
import { Appointment, AppointmentInsert } from "@/cms/types/appointment";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";





interface PreviewCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerData?: Customer
}

const PreviewCustomerModal: React.FC<PreviewCustomerModalProps> = ({ isOpen, onClose, customerData }) => {


    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl  h-auto">
            <CustomerPreviewData customer={customerData} className=" border-0!" />
        </Modal>
    );
};

export const AppointmentForm: React.FC<{
    setCustomer?: React.Dispatch<React.SetStateAction<Customer | null>>,
    setOpenModalCustomerPreview?: React.Dispatch<React.SetStateAction<boolean>>
    customerId?: string
    onSuccessBack?: () => void
    editData?: Appointment
    initialDate?: string
}> = ({ setCustomer, setOpenModalCustomerPreview, customerId, onSuccessBack, editData, initialDate }) => {

    const [appointment, setAppointment] = useState<AppointmentInsert>({
        appointmentDate: editData?.appointmentDate || initialDate || "",
        serviceId: editData?.serviceType?.serviceId,
        appointmentTypeId: editData?.appointmentType?.appointmentTypeId || "",
        note: editData?.note || "",
        customerId: customerId ? customerId : (editData?.customerNumber || ""),
    })
    const { t, language } = useTranslation();
    const [AddAppointment, { isLoading: isAdding }] = useInsertAppointmentMutationMutation()
    const [UpdateAppointment, { isLoading: isUpdating }] = useUpdateAppointmentMutation()
    const { addToast } = useToastContext()

    const isLoading = isAdding || isUpdating;

    const handleSubmit = async () => {
        try {
            if (!appointment.appointmentTypeId || !appointment.serviceId || !appointment.customerId || !appointment.appointmentDate) {
                addToast("error", t("common.error"))
                return
            }

            let result;
            if (editData) {
                result = await UpdateAppointment({
                    ...appointment,
                    appointmentId: editData.appointmentId,
                    done:editData.done,
                    en: editData.en,
                    th: editData.th
                }).unwrap()
            } else {
                result = await AddAppointment(appointment).unwrap()
            }

            if (result?.msg?.toLowerCase().includes("success")) {
                addToast("success", t("common.success"))
                if (onSuccessBack) {
                    onSuccessBack()
                }
                if (!editData) {
                    setAppointment({
                        appointmentDate: new Date().toISOString(),
                        serviceId: "",
                        appointmentTypeId: "",
                        note: "",
                        customerId: "",
                    })
                }

            } else {
                addToast("error", t("common.error"))
            }
        } catch (error) {
            console.error("Failed to process appointment:", error)
            addToast("error", t("common.error"))
        }
    }
    return <div className=" space-y-2 text-gray-500 dark:text-gray-200 font-medium text-sm xl:px-10 xl:py-12 px-5 py-7">
        {!customerId &&
            <>
                <div >
                    {t("common.customer")}
                </div>
                <div className={setOpenModalCustomerPreview ? "  grid grid-cols-[80%_20%] space-x-3 md:space-x-0 md:block " : " space-x-3 md:space-x-0 md:block "}>
                    <SearchableSelectApi value={appointment.customerId} onChange={(data) => {
                        setAppointment((prev) => ({
                            ...prev,
                            customerId: data
                        }))
                    }}
                        onChangeObject={(customerData: Customer) => {
                            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                            setCustomer && setCustomer(customerData);

                        }}
                        apiQuery={useGetCustommersQuery} labelKey={"displayName"} valueKey={"id"} placeholder={t("case.panel.customer_search")} disabled={!!editData}/>
                    {setOpenModalCustomerPreview && <Button className="md:hidden" size="sm" onClick={() => setOpenModalCustomerPreview(true)}><Eye /></Button>}
                </div></>
        }
        <div >
            {t("common.appointmentType")} <span className="text-red-500">*</span>
        </div>
        <SearchableSelectApi value={appointment?.appointmentTypeId || ""} onChange={(data) => {
            setAppointment((prev) => ({
                ...prev,
                appointmentTypeId: data
            }))
        }} apiQuery={useGetAppointmentTypeQuery}
            labelKey={language == "th" ? "th" : "en"}
            valueKey={"appointmentTypeId"}
            filterOption={(appointmentType: AppointmentType) => Boolean(appointmentType.active)}
            placeholder={t("case.panel.serviceType_search")}
            disabled={ !appointment.customerId || !!editData} />
        <div >
            {t("common.serviceType")} <span className="text-red-500">*</span>
        </div>
        <SearchableSelectApi value={appointment.serviceId || ""} onChange={(data) => {
            setAppointment((prev) => ({
                ...prev,
                serviceId: data
            }))
        }}
            apiQuery={useGetServiceTypeQuery}
            labelKey={language == "th" ? "th" : "en"} valueKey={"serviceId"}
            placeholder={t("case.panel.appointmentType_search")}
            disabled={ !!editData || !appointment.customerId} />
        <div >
            {t("common.appointDate")} <span className="text-red-500">*</span>
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
            disabled={!customerId && !appointment.customerId}
        />
        <div >
            {t("common.note")}
        </div>
        <textarea className={COMMON_INPUT_CSS} onChange={(e) => {
            setAppointment((prev) => ({
                ...prev,
                note: e.target.value
            }))
        }}
            disabled={!customerId && !appointment.customerId}> </textarea>
        <div className="flex space-x-2">
            <Button className="w-full" onClick={handleSubmit}
                disabled={isLoading}>
                {editData ? t("common.save") : t("common.add")}
            </Button>

        </div>
    </div>
}


// // eslint-disable-next-line @typescript-eslint/no-empty-object-type
const AppointmentCreate: React.FC<{ editData?: Appointment; initialDate?: string }> = ({ editData, initialDate }) => {

    const [customer, setCustomer] = useState<Customer | null>(null)
    const [openModalCustomerPreview, setOpenModalCustomerPreview] = useState<boolean>(false)

    const { data: customerData } = useGetCustomerQuery(editData?.customerNumber || "", { skip: !editData?.customerNumber })

    useEffect(() => {
        if (customerData?.data) {
            setCustomer(customerData.data)
        }
    }, [customerData])

    return (
        <div className="min-h-screen rounded-2xl border border-gray-200 bg-white  dark:border-gray-800 dark:bg-white/3 ">
            <div className=" grid sm:grid-cols-2  space-x-2 min-h-screen">
                <CustomerPreviewData customer={customer || undefined} className="hidden md:block" />
                <AppointmentForm setCustomer={setCustomer} setOpenModalCustomerPreview={setOpenModalCustomerPreview} editData={editData} initialDate={initialDate} />
            </div>
            <PreviewCustomerModal isOpen={openModalCustomerPreview} customerData={customer || undefined} onClose={() => { setOpenModalCustomerPreview(false) }} />
        </div>
    );
};

export default AppointmentCreate;