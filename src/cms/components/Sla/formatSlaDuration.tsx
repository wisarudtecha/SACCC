import { useTranslation } from "@/core/hooks/useTranslation";
import { TranslationParams } from "@/core/types/i18n";
import { useCallback } from "react";

const calculateTimeDiff = (minutes: number, t: (key: string, params?: TranslationParams | undefined)=>string) => {
    if (minutes <= 0) return `0 ${t("time.m")}`;

    const diffSeconds = Math.floor(minutes * 60);
    const diffMinutes = Math.floor(minutes);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const years = diffYears;
    const months = diffMonths % 12;
    const days = diffDays % 30;
    const hours = diffHours % 24;
    const mins = diffMinutes % 60;
    const seconds = diffSeconds % 60;

    const timeUnits = [];

    if (years > 0) timeUnits.push(`${years} ${t("time.y")}`);
    if (months > 0) timeUnits.push(`${months} ${t("time.mo")}`);
    if (days > 0) timeUnits.push(`${days} ${t("time.d")}`);
    if (hours > 0) timeUnits.push(`${hours} ${t("time.h")}`);
    if (mins > 0) timeUnits.push(`${mins} ${t("time.m")}`);
    if (seconds > 0) timeUnits.push(`${seconds} ${t("time.s")}`);

    return timeUnits.slice(0, 2).join(' ') || `0 ${t("time.s")}`;
}

export const formatDuration = (minutes: number) => {
    const { t } = useTranslation();

    return calculateTimeDiff(minutes, t)
};

//for use context error in console log break react rule
export const useFormatDuration = () => {
    const { t } = useTranslation();

    return useCallback((minutes: number) => {

        return calculateTimeDiff(minutes, t);
    }, [t]);
};