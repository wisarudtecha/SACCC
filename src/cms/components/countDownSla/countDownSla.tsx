import React, { useState, useEffect } from 'react';
import Badge from '@/core/components/ui/badge/Badge';
import { useTranslation } from '@/core/hooks/useTranslation';

interface CountdownTimerProps {
  targetTime?: number;
  createdAt?: string;
  sla?: number;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const CompactCountdownTimer: React.FC<CountdownTimerProps> = ({ 
  createdAt, 
  className = "",
  sla,
  size = "xs" 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    isOverdue: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    years: number;
    months: number;
  } | null>(null);
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  if ((sla !== undefined && (sla === null))||!createdAt || sla === undefined) {
    return null;
  }

  const targetTime = new Date(createdAt).getTime() + (sla * 60 * 1000);
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Date.now();
      const diffMs = targetTime - now;
      const isOverdue = diffMs <= 0;
      const absoluteSeconds = Math.floor(Math.abs(diffMs) / 1000);
      const years = Math.floor(absoluteSeconds / (365 * 24 * 60 * 60));
      const remainingAfterYears = absoluteSeconds % (365 * 24 * 60 * 60);
      
      const months = Math.floor(remainingAfterYears / (30 * 24 * 60 * 60));
      const remainingAfterMonths = remainingAfterYears % (30 * 24 * 60 * 60);
      
      const days = Math.floor(remainingAfterMonths / (24 * 60 * 60));
      const remainingAfterDays = remainingAfterMonths % (24 * 60 * 60);
      
      const hours = Math.floor(remainingAfterDays / (60 * 60));
      const remainingAfterHours = remainingAfterDays % (60 * 60);
      
      const minutes = Math.floor(remainingAfterHours / 60);
      const seconds = remainingAfterHours % 60;

      return {
        isOverdue,
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        totalSeconds: isOverdue ? -absoluteSeconds : absoluteSeconds
      };
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  if (!timeRemaining) {
    return null
  }

  const formatDetailedTime = () => {
    const parts = [];
    if (timeRemaining.years > 0) parts.push(`${t("time.Years")}: ${timeRemaining.years}`);
    if (timeRemaining.months > 0) parts.push(`${t("time.Months")}: ${timeRemaining.months}`);
    if (timeRemaining.days > 0) parts.push(`${t("time.Days")}: ${timeRemaining.days}`);
    parts.push(`${t("time.Hours")}: ${timeRemaining.hours}`);
    parts.push(`${t("time.Minutes")}: ${timeRemaining.minutes}`);
    parts.push(`${t("time.Seconds")}: ${timeRemaining.seconds}`);
    return parts;
  };

  if (timeRemaining.isOverdue) {
    return (
      <div 
        className="relative inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Badge 
          variant="solid" 
          color="error" 
          size={size} 
          className={`animate-pulse ${className}`}
        >
          {t("time.Overdue")}
        </Badge>
        {isHovered && (
          <div className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-3 py-2 text-gray-500 bg-white dark:bg-gray-900 dark:text-white text-xs rounded-lg shadow-lg whitespace-nowrap border dark:border-gray-700">
            <div className="text-red-500 font-semibold mt-1">{t("time.OVERDUE")}</div>
            <div className="text-center text-gray-400 dark:text-gray-500">
              {formatDetailedTime().map((part, index) => (
                <div key={index}>{part}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const formatTimeRemaining = () => {
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}${t("time.d")} ${timeRemaining.hours}${t("time.h")}`;
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}${t("time.h")} ${timeRemaining.minutes}${t("time.m")}`;
    } else {
      return `${timeRemaining.minutes}${t("time.m")}`;
    }
  };

  const getCompactColor = () => {
    if (timeRemaining.totalSeconds <= 3600) return "error";
    if (timeRemaining.totalSeconds <= 10800) return "warning";
    return "primary";
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge
        variant="solid"
        color={getCompactColor()}
        size={size}
        className={className+" bg-gray-400 dark:bg-gray-600"}
      >
        {formatTimeRemaining()}
      </Badge>
      
      {isHovered && (
        <div className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-3 py-2 text-gray-500 bg-white dark:bg-gray-900 dark:text-white text-xs rounded-lg shadow-lg whitespace-nowrap border dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400 font-semibold mt-1">{t("time.TIMEREMAINING")}</div>
          <div className="text-center text-gray-400 dark:text-gray-500">
            {formatDetailedTime().map((part, index) => (
              <div key={index}>{part}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};