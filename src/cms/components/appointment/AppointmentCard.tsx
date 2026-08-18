import { useNavigate } from "react-router-dom";
import Badge from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";
import { useState } from "react";
import { ConfirmationModal } from "../case/modal/ConfirmationModal";
import { Notebook, Phone, Ticket, User2, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/core/utils/crud";
import { useChangeAppointmentStatusMutation, useDeleteAppointmentMutation, useUpdateAppointmentMutation } from "@/cms/store/api/appointment";
import { Appointment } from "@/cms/types/appointment";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import Checkbox from "@/cms/components/form/input/Checkbox";
import { Avatar } from "@/core/components/ui/avatar/Avatarv2";




type AppointmentCardProp = React.FC<{
    appointmentData: Appointment;
    showCaseId?: boolean;
    className?: string;
    showMobileNumber?: boolean;
    showCustomer?: boolean;
    showAppointmentUser?: boolean;
    onEdit?: (data: Appointment) => void;
}>;

export const AppointmentCard: AppointmentCardProp = ({
    appointmentData,
    showCaseId = false,
    showMobileNumber = false,
    showCustomer = true,
    showAppointmentUser = false,
    onEdit,
    className
}) => {
    const { language, t } = useTranslation();
    const [openModalNextStage, setOpenModalNextStage] = useState<boolean>(false);
    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const navigate = useNavigate();
    const [changeStatus] = useChangeAppointmentStatusMutation()
    const [deleteAppointment] = useDeleteAppointmentMutation()
    const { addToast } = useToastContext()
    const [UpdateAppointment] = useUpdateAppointmentMutation()

    const handleChangeStatus = async () => {
        try {
            const result = await changeStatus(appointmentData.appointmentId).unwrap()
            if (result?.msg?.toLowerCase() === "success") {
                addToast("success", result?.message || result?.desc || result?.msg || t("common.success"))
            } else {
                addToast("error", result?.message || result?.desc || result?.msg || t("common.error"))
            }
            // // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            addToast("error", (error as { data?: { message?: string } })?.data?.message
                || (error as { data?: { desc?: string } })?.data?.desc
                || (error as { data?: { msg?: string } })?.data?.msg
                || t("common.error"))
        } finally {
            setOpenModalNextStage(false)
        }
    }
    const handleDelete = async () => {
        try {
            const result = await deleteAppointment({ appointmentId: appointmentData.appointmentId }).unwrap()
            if (result?.msg?.toLowerCase().includes("success")) {
                addToast("success", result?.message || result?.desc || result?.msg || t("common.success"))
            } else {
                addToast("error", result?.message || result?.desc || result?.msg || t("common.error"))
            }
        } catch (error) {
            addToast("error", (error as { data?: { message?: string } })?.data?.message
                || (error as { data?: { desc?: string } })?.data?.desc
                || (error as { data?: { msg?: string } })?.data?.msg
                || t("common.error"))
        } finally {
            setOpenDeleteModal(false)
        }
    }

    const handleChangeDone = async (checked: boolean) => {
        try {
            const result = await UpdateAppointment({
                appointmentId: appointmentData.appointmentId,
                done: checked,
                appointmentDate: appointmentData.appointmentDate,
                appointmentTypeId: appointmentData.appointmentType.appointmentTypeId,
                serviceId: appointmentData.serviceType.serviceId,
                note: appointmentData.note,
                customerId: appointmentData.customerNumber,
                en: appointmentData.en,
                th: appointmentData.th,
            }).unwrap()
            if (!result?.msg?.toLowerCase().includes("success")) {
                addToast("error", result?.message || result?.desc || result?.msg || t("common.error"))
            }
        } catch (error) {
            addToast("error", (error as { data?: { message?: string } })?.data?.message
                || (error as { data?: { desc?: string } })?.data?.desc
                || (error as { data?: { msg?: string } })?.data?.msg
                || t("common.error"))
        }
    }
    const isOwner = JSON.parse(localStorage.getItem("profile") ?? "{}").username === appointmentData.createdBy
    return (
        <div
            key={appointmentData.id}
            className={`flex flex-col  bg-gray-200 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors group ` + className}
        >
            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between items-start">
                    <div className="flex space-x-3">
                        {isOwner && <Checkbox checked={appointmentData.done} onChange={handleChangeDone} className="border-3" />}
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-tight mb-2">
                            {appointmentData.appointmentType[language === "th" ? "th" : "en"]} - {appointmentData.serviceType[language === "th" ? "th" : "en"]}
                        </h4>
                    </div>
                    <div className="flex  items-end gap-1">
                        {appointmentData.status.statusId && <Badge size="sm" color={appointmentData.nextStatus ? "medium" : "success"}>{appointmentData.status[language === "th" ? "th" : "en"]}</Badge>}
                        <div className="flex items-center space-x-2 mb-1">
                            {isOwner &&
                                appointmentData.status.statusId === "A001" && (
                                    <>
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(appointmentData)}
                                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                title={t("common.edit")}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setOpenDeleteModal(true)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title={t("common.delete")}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                        </div>
                        {/* {caseId === appointmentData.caseId && <Badge variant="outline" size="sm">{t("common.watching")}</Badge>} */}

                    </div>
                </div>
                {/* <Badge color={`${getTextPriority(appointmentData.serviceType.priority).color}`}>
                    {t(`case.sop_card.${getTextPriority(appointmentData.serviceType.priority).level} Priority`)}
                </Badge> */}

                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-400 leading-tight">
                    {appointmentData.note && <div className="flex"><Notebook size={18} className="mr-3" /> {appointmentData.note}</div>}
                </h5>

                <div className={`flex items-center text-gray-500 dark:text-gray-400 ${showCaseId && appointmentData.caseId ? "justify-between" : "justify-end"} `}>
                    {/* {showCaseId && appointmentData.caseId && (
                        <div onClick={() => navigate(`/cms/case/${appointmentData.caseId}`)}>
                            <Badge size="sm" variant="outline" className="!cursor-pointer hover:underline">{appointmentData.caseId}</Badge>
                        </div>
                    )} */}
                    {showCaseId && appointmentData.caseId && <div className="flex">
                        <Ticket />
                        <div className="mx-2">
                            <span className="text-sm ">
                                {t("case.display.no")} # <span onClick={() => navigate(`/cms/case/${appointmentData.caseId}`)} className=" font-medium text-gray-900 dark:text-white cursor-pointer! hover:underline hover:text-blue-400!">
                                    {appointmentData.caseId || "-"}
                                </span>
                            </span>

                        </div>
                    </div>
                    }

                </div>



                {showMobileNumber && <div className={`flex items-center text-gray-500 dark:text-gray-400`}>
                    {/* {showCaseId && appointmentData.caseId && (
                        <div onClick={() => navigate(`/cms/case/${appointmentData.caseId}`)}>
                            <Badge size="sm" variant="outline" className="!cursor-pointer hover:underline">{appointmentData.caseId}</Badge>
                        </div>
                    )} */}
                    <div className="flex">
                        <Phone />
                        <div className="mx-2">
                            <span className="text-sm ">
                                {appointmentData.customerMobileNo || "-"}
                            </span>
                        </div>
                    </div>
                </div>}

                {showCustomer && <div className="flex text-gray-600 dark:text-gray-400  space-x-2">
                    {appointmentData.customerPhoto ?
                        <Avatar className="w-8 h-8 justify-center items-center " >
                            <img src={appointmentData.customerPhoto} className="h-full w-full object-cover rounded-full"/>
                        </Avatar>
                        : <User2 size={18} />}
                    <div className="block text-sm self-center ">{appointmentData.customerName}</div>
                    {/* <Badge size="sm">{appointmentData.customerNumber}</Badge> */}
                </div>}
                {showAppointmentUser && <div className="flex text-gray-600 dark:text-gray-400  space-x-2">
                    <User2 size={18} />
                    <div className="block text-sm ">{appointmentData.createdBy}</div>
                    {/* <Badge size="sm">{appointmentData.customerNumber}</Badge> */}
                </div>}

            </div>

            <div className="flex items-center justify-between mt-4 pt-2  border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-600 dark:text-gray-500">
                    {formatDate(appointmentData.appointmentDate)}
                </span>

                {appointmentData.nextStatus?.statusId && isOwner && (
                    <Button
                        size="sm"
                        onClick={() => setOpenModalNextStage(true)}
                    >
                        {appointmentData.nextStatus[language === "th" ? "th" : "en"]}
                    </Button>
                )}
            </div>

            <ConfirmationModal
                onClose={() => setOpenModalNextStage(false)}
                isOpen={openModalNextStage}
                title={`${t("common.change_status_to")} ${appointmentData?.nextStatus
                    ? appointmentData.nextStatus[language === "th" ? "th" : "en"]
                    : ""
                    }`}
                onConfirm={handleChangeStatus}
                description={undefined} />

            <ConfirmationModal
                onClose={() => setOpenDeleteModal(false)}
                isOpen={openDeleteModal}
                title={t("common.delete")}
                onConfirm={handleDelete}
                confirmButtonVariant="error"
                description={t("appointment.delete_warning")} />
        </div>
    );
};