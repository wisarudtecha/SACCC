import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import { Appointment } from "@/cms/types/appointment";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Modal } from "@/core/components/ui/modal";
import { useModal } from "@/core/hooks/useModal";
import { AppointmentCard } from "./AppointmentCard";

interface AppointmentCalendarProps {
    appointments: Appointment[];
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ appointments }) => {
    const { language } = useTranslation();
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);

    const events: EventInput[] = appointments.map((app) => ({
        id: app.appointmentId,
        title: `${app.appointmentType[language === "th" ? "th" : "en"]} - ${app.customerName}`,
        start: app.appointmentDate,
        extendedProps: {
            appointment: app,
            calendar: app.nextStatus ? "Warning" : "Success",
        },
    }));

    const handleEventClick = (clickInfo: EventClickArg) => {
        const appointment = clickInfo.event.extendedProps.appointment as Appointment;
        setSelectedAppointment(appointment);
        openModal();
    };

    return (
        <div className="custom-calendar bg-white dark:bg-white/3 rounded-xl overflow-hidden">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={language === "th" ? "th" : "en"}
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                height="auto"
            />

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-md">
                {selectedAppointment && (
                    <div className="p-4">
                        <AppointmentCard
                            appointmentData={selectedAppointment}
                            showCaseId={true}
                            showMobileNumber={true}
                            showAppointmentUser={true}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderEventContent = (eventInfo: any) => {
    const calendar = eventInfo.event.extendedProps.calendar || "Primary";
    const colorClass = `fc-bg-${calendar.toLowerCase()}`;
    return (
        <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm w-full overflow-hidden`}>
            <div className="fc-daygrid-event-dot"></div>
            <div className="fc-event-time text-xs mr-1">{eventInfo.timeText}</div>
            <div className="fc-event-title text-xs truncate">{eventInfo.event.title}</div>
        </div>
    );
};

export default AppointmentCalendar;
