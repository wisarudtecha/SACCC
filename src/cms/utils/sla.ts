// /src/utils/sla.ts
export interface SLADifference {
  milliseconds: number;
  formatted: string;
}

/**
 * Calculate time difference between two dates
 */
export const calculateTimeDifference = (
  startDate: string | Date,
  endDate: string | Date,
  language?: string
): SLADifference => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diff = end - start;

  return {
    milliseconds: diff,
    formatted: formatTimeDifference(diff, language)
  };
};

/**
 * Format milliseconds to human-readable format
 * Examples: "5s", "10m 43s", "6d 22h", "2h 15m"
 */
export const formatTimeDifference = (milliseconds: number, language?: string): string => {
  if (milliseconds < 0) return `0${language === "th" ? "วิ." : "s"}}`;

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    if (language === "th") {
      return remainingHours > 0 ? `${days}ว. ${remainingHours}ชม.` : `${days}ว.`;
    }
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (language === "th") {
      return remainingMinutes > 0 ? `${hours}ชม. ${remainingMinutes}น.` : `${hours}ชม.`;
    }
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    if (language === "th") {
      return remainingSeconds > 0 ? `${minutes}น. ${remainingSeconds}วิ.` : `${minutes}น.`;
    }
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  if (language === "th") {
    return `${seconds}วิ.`;
  }
  return `${seconds}s`;
};

/**
 * Calculate SLA between all timeline steps
 */
export const calculateTimelinesSLA = (
  steps: Array<{ metadata?: { createdAt?: string } }>,
  language?: string
): Array<SLADifference | null> => {
  const slaList: Array<SLADifference | null> = [];

  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i];
    const nextStep = steps[i + 1];

    const currentDate = currentStep?.metadata?.createdAt;
    const nextDate = nextStep?.metadata?.createdAt;

    if (currentDate && nextDate) {
      slaList.push(calculateTimeDifference(currentDate, nextDate, language));
    } else {
      slaList.push(null);
    }
  }

  return slaList;
};