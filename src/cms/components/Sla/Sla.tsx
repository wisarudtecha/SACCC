import { useTranslation } from "@/core/hooks/useTranslation";
import { useState, useEffect } from "react";
import Badge from "@/core/components/ui/badge/Badge";
import { CheckCircle, Circle } from "lucide-react";
import { getTimeDifference } from "../case/sopStepTranForm";
import { useFormatDuration } from "./formatSlaDuration";


export const SLACountdownBadgeAssignment = ({ createDate, sla }: { createDate: string, sla: number }) => {
    const [timeRemaining, setTimeRemaining] = useState<{
        isOverdue: boolean;
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        totalSeconds: number;
    } | null>(null);
    const { t } = useTranslation();
    const waring = parseInt(import.meta.env.VITE_CASE_ASSIGNMENT_WARING_SLA || "7200", 10);
    const alert = parseInt(import.meta.env.VITE_CASE_ASSIGNMENT_ALERT_SLA || "3600", 10);
    if (sla === null) {
        return null;
    }

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const createdDate = new Date(createDate);
            const slaDeadline = new Date(createdDate.getTime() + (sla * 60 * 1000));
            const now = new Date();
            const diffMs = slaDeadline.getTime() - now.getTime();
            if (diffMs <= 0) {
                const overdueSeconds = Math.abs(Math.floor(diffMs / 1000));
                const overdueDays = Math.floor(overdueSeconds / (24 * 60 * 60));
                const overdueHours = Math.floor((overdueSeconds % (24 * 60 * 60)) / (60 * 60));
                const overdueMinutes = Math.floor((overdueSeconds % (60 * 60)) / 60);

                return {
                    isOverdue: true,
                    days: overdueDays,
                    hours: overdueHours,
                    minutes: overdueMinutes,
                    seconds: overdueSeconds % 60,
                    totalSeconds: overdueSeconds
                };
            }


            const totalSeconds = Math.floor(diffMs / 1000);
            const days = Math.floor(totalSeconds / (24 * 60 * 60));
            const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
            const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
            const seconds = totalSeconds % 60;

            return {
                isOverdue: false,
                days,
                hours,
                minutes,
                seconds,
                totalSeconds
            };
        };

        setTimeRemaining(calculateTimeRemaining());

        const interval = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining());
        }, 1000);

        return () => clearInterval(interval);
    }, [createDate, sla]);

    if (!timeRemaining) {
        return null;
    }

    const formatOverdueTime = () => {
        if (timeRemaining.days > 0) {
            return `${timeRemaining.days} ${t("time.d")} ${timeRemaining.hours}${t("time.h")}`;
        } else if (timeRemaining.hours > 0) {
            return `${timeRemaining.hours} ${t("time.h")} ${timeRemaining.minutes}${t("time.m")}`;
        } else if (timeRemaining.minutes > 0) {
            return `${timeRemaining.minutes} ${t("time.m")}`;
        } else {
            return `${timeRemaining.seconds} ${t("time.s")}`;
        }
    };

    const formatRemainingTime = () => {
        if (timeRemaining.days > 0) {
            return `${timeRemaining.days} ${t("time.d")} ${timeRemaining.hours}${t("time.h")}`;
        } else if (timeRemaining.hours > 0) {
            return `${timeRemaining.hours} ${t("time.h")} ${timeRemaining.minutes}${t("time.m")}`;
        } else if (timeRemaining.minutes > 0) {
            return `${timeRemaining.minutes} ${t("time.m")}`;
        } else {
            return `${timeRemaining.seconds} ${t("time.s")}`;
        }
    };

    if (timeRemaining.isOverdue) {
        return (
            <Badge
                variant="solid"
                color="error"
                size="xs"
                className="text-center animate-pulse"
            >
                {t("progress.overdue_by")} {formatOverdueTime()}
            </Badge>
        );
    }

    if (timeRemaining.totalSeconds <= alert) {
        return (
            <Badge
                variant="outline"
                color="error"
                size="xs"
                className="text-center"
            >
                {t("time.TIMEREMAINING")} {formatRemainingTime()}
            </Badge>
        );
    } else if (timeRemaining.totalSeconds <= waring) {
        return (
            <Badge
                variant="outline"
                color="warning"
                size="xs"
                className="text-center"
            >
                {t("time.TIMEREMAINING")} {formatRemainingTime()}
            </Badge>
        );
    }

    return null;
};

export const StepCircle: React.FC<{
    completed: boolean;
    current: boolean;
    violated: boolean;
    step: any;
    previousStep?: any;
}> = ({ completed, current, violated, step, previousStep }) => {
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);
    const formatDuration = useFormatDuration();
    const base =
        "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-800 relative z-10 flex-shrink-0 cursor-pointer";
    const stateClasses = completed
        ? violated
            ? "border-red-500 text-red-500"
            : "border-blue-500 text-blue-500"
        : current
            ? violated
                ? "border-red-500 text-red-500"
                : "border-blue-500 text-blue-500"
            : "border-gray-300 dark:border-gray-600 text-gray-400";

    const calculateSlaPerformance = () => {
        if (!step.sla || (!completed && !current) || !step.timeline?.completedAt || !previousStep?.timeline?.completedAt) {
            return null;
        }

        const startTime = new Date(previousStep.timeline.completedAt).getTime();
        const endTime = new Date(step.timeline.completedAt).getTime();
        const actualDurationMs = endTime - startTime;
        const actualDurationMinutes = actualDurationMs / (1000 * 60);
        const slaDurationMinutes = step.sla;

        const difference = actualDurationMinutes - slaDurationMinutes;
        const isOverdue = difference > 0;

        return {
            actualDuration: actualDurationMinutes,
            slaDuration: slaDurationMinutes,
            difference: Math.abs(difference),
            isOverdue
        };
    };

    const slaPerformance = calculateSlaPerformance();



    const renderTooltipContent = () => {
        if ((completed || current) && slaPerformance) {
            return (
                <div className="space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {step.title}
                    </div>
                    <div className="text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                            {t("progress.sla")}: {formatDuration(slaPerformance.slaDuration)}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                            {t("progress.actual")}: {formatDuration(slaPerformance.actualDuration)}
                        </div>
                        <div className={`font-medium ${slaPerformance.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {slaPerformance.isOverdue
                                ? `${t("progress.overdue_by")}: ${formatDuration(slaPerformance.difference)}`
                                : `${t("progress.faster_by")}: ${formatDuration(slaPerformance.difference)}`
                            }
                        </div>
                    </div>
                </div>
            );
        } else if (step.sla || step.sla === 0) {
            return (
                <div className="space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {step.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("progress.sla")}: {formatDuration(step.sla)}
                    </div>
                    {!completed && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                            {current ? t("progress.in_progress") : t("progress.pending")}
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <div className="space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {step.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t("progress.no_sla")}
                    </div>
                </div>
            );
        }
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`${base} ${stateClasses}`}>
                {completed ? (
                    <CheckCircle className="w-5 h-5" />
                ) : (
                    <Circle className={`w-3 h-3 ${current ? "fill-current" : ""}`} />
                )}
            </div>

            {isHovered && (
                <div className="absolute z-50 bottom-1/2 left-1/2 transform  mb-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg whitespace-nowrap">
                    {renderTooltipContent()}
                    {/* Arrow */}

                </div>
            )}
        </div>
    );
};

export const TimeBadge: React.FC<{ from: any; to: any; violated: boolean }> = ({
    from,
    to,
    violated,
}) => {
    const timeDiff = getTimeDifference(from, to);
    if (!timeDiff) return null;
    const style = !violated
        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
        : "bg-red-100 dark:bg-red-900 border-red-500 text-red-500 dark:text-red-300";
    return (
        <div
            className={`${style} px-2 py-1 w-fit rounded text-xs font-medium whitespace-nowrap`}
        >
            {timeDiff}
        </div>
    );
};
