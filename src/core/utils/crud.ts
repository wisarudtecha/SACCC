// /src/utils/crud.ts
import { useTranslation as UseTranslation } from "@/core/hooks/useTranslation";

// export const formatDate = (dateString: string | Date) => {
//   return new Date(dateString).toLocaleDateString("en-US", {
//     year: "numeric",
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit"
//   });
// };

interface DateFormatOptions {
  locale?: string;
  includeTime?: boolean;
  dateStyle?: "full" | "long" | "medium" | "short";
}

export const formatDate = (
  dateString: string | Date,
  options: DateFormatOptions = {}
) => {
  // const { language } = UseTranslation();
  const storage = localStorage || sessionStorage;
  const language = storage.getItem("language") || "th";
  
  // const langLocale = { th: "th-TH", en: "en-US", cn: "zh-CN" };
  const langLocale: { [key: string]: string } = { th: "th-TH", en: "en-US", cn: "zh-CN" };

  const { 
    locale = langLocale[language] || "en-US", 
    includeTime = true,
    dateStyle = "medium"
  } = options;

  const date = new Date(dateString);
  
  if (includeTime) {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric", 
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  
  return date.toLocaleDateString(locale, {
    dateStyle
  });
};

export const formatLastLogin = (dateString: string | Date) => {
  const { t } = UseTranslation();

  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return t("crud.user.unit.last_login.today");
  }
  if (diffDays === 1) {
    return t("crud.user.unit.last_login.yesterday");
  }
  if (diffDays < 7) {
    return `${diffDays} ${t("crud.user.unit.last_login.day")?.replace("_S_", diffDays > 1 && "s" || "")}`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${t("crud.user.unit.last_login.week")?.replace("_S_", weeks > 1 && "s" || "")}`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} ${t("crud.user.unit.last_login.month")?.replace("_S_", months > 1 && "s" || "")}`;
};

export const getUniqueValues = <T>(
  array: T[], 
  key: keyof T
): string[] => {
  return [...new Set(array.map(item => String(item[key])).filter(Boolean))];
};

export const createFilterOptions = <T>(
  array: T[], 
  key: keyof T, 
  labelFormatter?: (value: string) => string
) => {
  return getUniqueValues(array, key).map(value => ({
    value,
    label: labelFormatter ? labelFormatter(value) : value
  }));
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  // let timeout: NodeJS.Timeout;
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const normalizeDate = (value: string | null | undefined) => {
  if (!value || value === "0001-01-01T00:00:00Z") return null;
  return new Date(value);
};
