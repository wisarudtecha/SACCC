import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { AppointmentCard } from "./AppointmentCard";
import Loading from "../common/Loading";
import { useState, useRef, useMemo } from "react";

import OnBackOnly from "../ui/pagesTemplate/onBackOnly";
import AppointmentCreate from "./AppointmentCreate";
import { CheckLineIcon, ClockFading, CalendarDays, LayoutGrid, Plus, X, Filter, Clock, User2, Search } from "lucide-react";
import MetricsCard from "../admin/MetricsCard";
import { useGetAppointmentQuery, useGetMyAppointmentStatusCountQuery } from "@/cms/store/api/appointment";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Appointment as AppointmentDataType } from "@/cms/types/appointment";
import { useEffect } from "react";
import Select from "@/core/components/form/Select";

// Calendar imports
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, EventClickArg, DateSelectArg } from "@fullcalendar/core";
import { Modal } from "@/core/components/ui/modal";
import { useModal } from "@/core/hooks/useModal";
import { formatDate } from "@/core/utils/crud";
import DatePickerLocal from "@/cms/components/form/input/DatepicketLocal";


const Appointment: React.FC = () => {
    const { t, language } = useTranslation();
    const PAGE_SIZE = 20;
    const [start, setStart] = useState(0);
    const [appointments, setAppointments] = useState<AppointmentDataType[]>([]);
    const [hasMore, setHasMore] = useState(true);

    const [filterConfig, setFilterConfig] = useState<{ search: string, start_date: string, end_date: string, done?: boolean | null }>({ search: "", start_date: "", end_date: "", done: false })
    const { data: appointment, isFetching, isLoading } = useGetAppointmentQuery({
        search: filterConfig.search,
        start_date: filterConfig.start_date,
        end_date: filterConfig.end_date,
        ...(filterConfig.done !== null && { done: filterConfig.done }),
        start: start,
        length: PAGE_SIZE
    }, { refetchOnMountOrArgChange: true })
    const { data: statusCountData } = useGetMyAppointmentStatusCountQuery(undefined, { refetchOnMountOrArgChange: true });

    useEffect(() => {
        setAppointments([]);
        setStart(0);
        setHasMore(true);
    }, [filterConfig.search, filterConfig.start_date, filterConfig.end_date]);

    useEffect(() => {
        if (appointment?.data) {
            const newData = appointment.data;
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
    }, [appointment?.data, start]);

    const [searchInput, setSearchInput] = useState<string>('');
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
    const [displayMode, setDisplayMode] = useState<'grid' | 'calendar'>('grid');
    const [editData, setEditData] = useState<AppointmentDataType | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [initialDate, setInitialDate] = useState<string>('');

    // Calendar state
    const calendarRef = useRef<FullCalendar>(null);
    const { isOpen: isCalendarModalOpen, openModal: openCalendarModal, closeModal: closeCalendarModal } = useModal();
    const [selectedCalendarAppointmentId, setSelectedCalendarAppointmentId] = useState<string | null>(null);

    // "More" events modal state
    const { isOpen: isMoreModalOpen, openModal: openMoreModal, closeModal: closeMoreModal } = useModal();
    const [moreModalDate, setMoreModalDate] = useState<string>('');
    const [moreModalEvents, setMoreModalEvents] = useState<AppointmentDataType[]>([]);

    // FIX #1: Derive the selected appointment from the live appointments array
    // so that checkbox updates propagate immediately
    const selectedCalendarAppointment = useMemo(() => {
        if (!selectedCalendarAppointmentId) return null;
        return appointments.find(a => a.appointmentId === selectedCalendarAppointmentId) || null;
    }, [selectedCalendarAppointmentId, appointments]);

    const handleSearch = () => {
        setFilterConfig(prev => ({ ...prev, search: searchInput }));
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') handleSearch();
    };

    const clearFilters = () => {
        const reset = { search: '', start_date: '', end_date: '' };
        setFilterConfig(reset);
        setSearchInput('');
    };

    const handleDateChange = (type: 'start_date' | 'end_date', date: Date | null) => {
        setFilterConfig(prev => ({
            ...prev,
            [type]: date ? date.toISOString() : ""
        }));
    };

    const handleBackToList = () => {
        setViewMode('list');
        setEditData(null);
        setInitialDate('');
    };

    const handleEdit = (data: AppointmentDataType) => {
        setEditData(data);
        setViewMode('edit');
    };

    // Calendar event mapping
    const calendarEvents: EventInput[] = appointments.map((app) => ({
        id: app.appointmentId,
        title: `${app.appointmentType[language === "th" ? "th" : "en"]} - ${app.customerName}`,
        start: app.appointmentDate,
        extendedProps: {
            appointment: app,
            calendar: app.done ? "Success" : (app.nextStatus ? "Warning" : "Primary"),
        },
    }));

    const handleCalendarEventClick = (clickInfo: EventClickArg) => {
        const appt = clickInfo.event.extendedProps.appointment as AppointmentDataType;
        setSelectedCalendarAppointmentId(appt.appointmentId);
        openCalendarModal();
    };

    // FIX #3: Click on empty calendar cell to create appointment with that date
    const handleCalendarDateSelect = (selectInfo: DateSelectArg) => {
        const selectedDate = selectInfo.start;
        setInitialDate(selectedDate.toISOString());
        setViewMode('create');
    };

    // FIX #2: Custom "more" link handler — show a beautiful modal instead of default popover
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMoreLinkClick = (info: any) => {
        const dateStr = info.date.toISOString().split('T')[0];
        const dayAppointments = appointments.filter(a => {
            const appDate = new Date(a.appointmentDate).toISOString().split('T')[0];
            return appDate === dateStr;
        });
        setMoreModalDate(formatDate(info.date.toISOString()));
        setMoreModalEvents(dayAppointments);
        openMoreModal();
        return 'none' as const; // prevent FullCalendar default popover
    };


    if (viewMode === 'create' || viewMode === 'edit') {
        return <OnBackOnly onBack={handleBackToList} >
            <AppointmentCreate editData={editData || undefined} initialDate={initialDate || undefined} />
        </OnBackOnly>
    }

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 50 && hasMore && !isFetching && !isLoading) {
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

    const handleOnChangeDone = (value: string) => {
        if (value === "all") {
            setFilterConfig({ ...filterConfig, done: null });
        } else if (value === "done") {
            setFilterConfig({ ...filterConfig, done: true });
        } else if (value === "notDone") {
            setFilterConfig({ ...filterConfig, done: false });
        }
    };

    const handleDoneValue = (value: boolean | null | undefined) => {
        if (value === null) {
            return "all";
        } else if (value === true) {
            return "done";
        } else if (value === false) {
            return "notDone";
        }
    };

    const hasActiveFilters = filterConfig.search || filterConfig.start_date || filterConfig.end_date;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Metrics Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attrMetrics.map((metric) => (
                    <MetricsCard
                        key={metric.key}
                        title={metric.title}
                        value={appointmentInfo[metric.key as keyof typeof appointmentInfo]}
                        icon={<metric.icon className={metric.className} />}
                        color={metric.color}
                        className="!mb-0 hover:shadow-lg transition-shadow duration-300"
                    />
                ))}
            </div>

            {/* Main Content Panel */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden shadow-sm">
                {/* Header Bar */}
                <div className="px-5 py-5 xl:px-8 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col gap-4">
                        {/* Top Row: Title, View Toggle, Create Button */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {t("common.appointment")}
                                </h2>
                                {appointments.length > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                        {appointments.length}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* View Toggle */}
                                <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
                                    <button
                                        onClick={() => setDisplayMode('grid')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${displayMode === 'grid'
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <LayoutGrid size={16} />
                                        <span className="hidden md:inline">{t("common.list") || "List"}</span>
                                    </button>
                                    <button
                                        onClick={() => setDisplayMode('calendar')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${displayMode === 'calendar'
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        <CalendarDays size={16} />
                                        <span className="hidden md:inline">{t("common.calendar") || "Calendar"}</span>
                                    </button>
                                </div>

                                {/* Filter Toggle (Mobile-friendly) */}
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${isFilterOpen || hasActiveFilters
                                        ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                                        }`}
                                >
                                    <Filter size={16} />
                                    <span className="hidden sm:inline">{t("common.filter") || "Filter"}</span>
                                    {hasActiveFilters && (
                                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                    )}
                                </button>

                                {/* Create Button */}
                                <Button
                                    variant="primary"
                                    className="!rounded-xl !px-4 !py-2 flex items-center gap-2"
                                    onClick={() => { setViewMode('create') }}
                                >
                                    <Plus size={18} />
                                    <span className="hidden sm:inline">{`${t("common.add")}${language == "en" ? " " : ""}${t("common.appointment")}`}</span>
                                </Button>
                            </div>
                        </div>

                        {/* Mobile View Toggle */}
                        <div className="flex sm:hidden items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
                            <button
                                onClick={() => setDisplayMode('grid')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${displayMode === 'grid'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <LayoutGrid size={16} />
                                {t("common.list") || "List"}
                            </button>
                            <button
                                onClick={() => setDisplayMode('calendar')}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${displayMode === 'calendar'
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <CalendarDays size={16} />
                                {t("common.calendar") || "Calendar"}
                            </button>
                        </div>

                        {/* Filter Bar - Collapsible */}
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFilterOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                {/* Search Input Group */}
                                <div className="relative flex-1 min-w-0">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <Search size={16} className="text-gray-400" />
                                    </div>
                                    <Input
                                        type="text"
                                        value={searchInput}
                                        onChange={(e) => { setSearchInput(e.target.value) }}
                                        placeholder={`${t("appointment.searchPlaceHolder")}...`}
                                        className="!pl-9 !rounded-xl"
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>

                                {/* Date Range */}
                                {displayMode != "calendar" && <div className="w-full sm:w-auto z-99999">
                                    <DatePickerLocal
                                        language={language}
                                        enableSelectStartAndEndDate={true}
                                        startDate={filterConfig.start_date ? new Date(filterConfig.start_date) : null}
                                        endDate={filterConfig.end_date ? new Date(filterConfig.end_date) : null}
                                        onChange={(dates: [Date | null, Date | null]) => {
                                            const [start, end] = dates;
                                            handleDateChange('start_date', start);
                                            handleDateChange('end_date', end);
                                        }}
                                        placeholderText={t("common.date_range")}
                                        className="p-2.5 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all dark:bg-gray-900!"
                                    />
                                </div>}

                                {/* Status Filter */}
                                <Select
                                    className="!w-full sm:!w-40"
                                    value={handleDoneValue(filterConfig.done)}
                                    onChange={(val) => handleOnChangeDone(val)}
                                    placeholder={t("common.all")}
                                    options={[
                                        { label: t("common.in_progress"), value: "notDone" },
                                        { label: t("common.done"), value: "done" },
                                        { label: t("common.all"), value: "all" },
                                    ]}
                                />

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Button onClick={handleSearch} variant="dark" className="!rounded-xl h-11 flex items-center gap-2">
                                        {/* <Search size={16} /> */}
                                        {t("common.search")}
                                    </Button>
                                    {hasActiveFilters && (
                                        <Button onClick={clearFilters} className="!rounded-xl h-11 flex items-center gap-2 !bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100 dark:!bg-red-900/20 dark:!text-red-400 dark:!border-red-800">
                                            <X size={16} />
                                            {t("common.clear_filters")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-5 xl:px-8">
                    {isLoading && start === 0 ? (
                        <Loading className="p-16" />
                    ) : displayMode === 'calendar' ? (
                        /* ──── Calendar View ──── */
                        <div className="custom-calendar rounded-xl overflow-hidden animate-in fade-in duration-300">
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                locale={language === "th" ? "th" : "en"}
                                headerToolbar={{
                                    left: "prev,next today",
                                    center: "title",
                                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                                }}
                                events={calendarEvents}
                                eventClick={handleCalendarEventClick}
                                eventContent={renderEventContent}
                                height="auto"
                                dayMaxEvents={3}
                                moreLinkContent={renderMoreLink}
                                moreLinkClick={handleMoreLinkClick}
                                selectable={true}
                                select={handleCalendarDateSelect}
                                unselectAuto={true}
                                selectMirror={true}
                            />
                        </div>
                    ) : appointments.length === 0 ? (
                        /* ──── Empty State ──── */
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                <CalendarDays size={28} className="text-gray-400" />
                            </div>
                            <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                                {t("common.no_result")}
                            </h3>
                        </div>
                    ) : (
                        /* ──── Grid/List View ──── */
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar max-h-[calc(100vh-280px)] pr-1 animate-in fade-in duration-300"
                            onScroll={handleScroll}
                        >
                            {appointments.map((item, idx) => (
                                <AppointmentCard
                                    key={item.id || idx}
                                    appointmentData={item}
                                    showCaseId={true}
                                    showMobileNumber={true}
                                    onEdit={handleEdit}
                                    className="!rounded-xl hover:shadow-md transition-shadow duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                />
                            ))}
                            {isFetching && <Loading className="col-span-full p-6" />}
                        </div>
                    )}
                </div>
            </div>

            {/* Calendar Event Detail Modal */}
            <Modal isOpen={isCalendarModalOpen} onClose={closeCalendarModal} className="max-w-md">
                {selectedCalendarAppointment && (
                    <div className="p-5">
                        <AppointmentCard
                            appointmentData={selectedCalendarAppointment}
                            showCaseId={true}
                            showMobileNumber={true}
                            showAppointmentUser={true}
                            onEdit={(data) => {
                                closeCalendarModal();
                                handleEdit(data);
                            }}
                        />
                    </div>
                )}
            </Modal>

            {/* "More" Events Modal — Better UI for overflow events */}
            <Modal isOpen={isMoreModalOpen} onClose={closeMoreModal} className="max-w-lg">
                <div className="p-6">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                                <CalendarDays size={20} className="text-brand-600 dark:text-brand-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {t("common.appointment")}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {moreModalDate}
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                            {moreModalEvents.length} {t("common.appointment")}
                        </span>
                    </div>

                    {/* Events List */}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                        {moreModalEvents.map((appt, idx) => (
                            <div
                                key={appt.appointmentId || idx}
                                onClick={() => {
                                    closeMoreModal();
                                    setSelectedCalendarAppointmentId(appt.appointmentId);
                                    openCalendarModal();
                                }}
                                className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm cursor-pointer transition-all duration-200"
                            >
                                {/* Status Indicator */}
                                <div className={`w-1 h-full min-h-[3rem] rounded-full flex-shrink-0 ${appt.done
                                    ? 'bg-green-500'
                                    : appt.nextStatus
                                        ? 'bg-orange-400'
                                        : 'bg-brand-500'
                                    }`}
                                />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {appt.appointmentType[language === "th" ? "th" : "en"]}
                                        </h4>
                                        {appt.done && (
                                            <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                {t("common.done")}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <User2 size={12} />
                                            {appt.customerName}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            <Clock size={12} />
                                            {new Date(appt.appointmentDate).toLocaleTimeString(language === "th" ? "th-TH" : "en-US", {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderEventContent = (eventInfo: any) => {
    const calendar = eventInfo.event.extendedProps.calendar || "Primary";
    const colorClass = `fc-bg-${calendar.toLowerCase()}`;
    return (
        <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm w-full overflow-hidden cursor-pointer`}>
            <div className="fc-daygrid-event-dot"></div>
            <div className="fc-event-time text-xs mr-1">{eventInfo.timeText}</div>
            <div className="fc-event-title text-xs truncate">{eventInfo.event.title}</div>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderMoreLink = (args: any) => {
    return (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors cursor-pointer">
            <Plus size={12} />
            <span>{args.num}</span>
        </div>
    );
};

export default Appointment;