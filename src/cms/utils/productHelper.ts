// src/cms/utils/productHelper.ts
import { useTranslation as Translation } from "@/core/hooks/useTranslation";
import { LOW_STOCK_THRESHOLD } from "@/cms/utils/constants";
import type { Column, FieldConfig } from "@/cms/types/product";

// Helper function to convert datetime to UTC full year
export const convertDatetimeToUTCFullYear = (datetime: Date | string): number => {
  const date = datetime instanceof Date ? datetime : new Date(datetime);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date input");
  }
  return date.getUTCFullYear();
}

// Helper function to convert days to months and days
export const convertDaysToMonths = (days: number, startDate: Date = new Date()): string => {
  const { language: lang } = Translation();
  if (days < 0) {
    throw new Error("Days cannot be negative");
  }
  let current = new Date(startDate);
  let remainingDays = days;
  let months = 0;
  while (true) {
    const next = new Date(current);
    next.setMonth(next.getMonth() + 1);
    const diffTime = next.getTime() - current.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    if (remainingDays >= diffDays) {
      remainingDays -= diffDays;
      current = next;
      months++;
    }
    else {
      break;
    }
  }
  const monthPart = months > 0 ? `${months} ${(lang === "th" && "เดือน") || "Month"}${lang === "en" && months > 1 ? "s" : ""}` : "";
  const dayPart = remainingDays > 0 ? `${remainingDays} ${(lang === "th" && "วัน") || "Day"}${lang === "en" && remainingDays > 1 ? "s" : ""}` : "";
  if (monthPart && dayPart) {
    return `${monthPart} ${dayPart}`;
  }
  else if (monthPart) {
    return monthPart;
  }
  else if (dayPart) {
    return dayPart;
  }
  else {
    return `0 ${lang === "th" && "วัน" || "Day"}`;
  }
};

// Helper function to convert months to years and months
export const convertMonthsToYears = (months: number): string => {
  const { language: lang } = Translation();
  if (months < 0) {
    throw new Error("Months cannot be negative");
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearPart = years > 0 ? `${years} ${lang === "th" && "ปี" || "Year"}${lang === "en" && years > 1 ? "s" : ""}` : "";
  const monthPart = remainingMonths > 0 ? `${remainingMonths} ${lang === "th" && "เดือน" || "Month"}${lang === "en" && remainingMonths > 1 ? "s" : ""}` : "";
  if (yearPart && monthPart) {
    return `${yearPart} ${monthPart}`;
  }
  else if (yearPart) {
    return yearPart;
  }
  else if (monthPart) {
    return monthPart;
  }
  else {
    return `0 ${lang === "th" && "เดือน" || "Month"}`;
  }
}

// Helper function to perform authenticated fetch with language header
export const formatDateTime = (date: string) => {
  if (!date) {
    return "";
  }
  try {
    const d = new Date(date);
    // return d.toISOString().slice(0, 16);
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
  catch {
    return "";
  }
};

// Helper function to format price with currency, locale, and digit 
export const formatPrice = (value: number | string, currency: string = "THB", locale: string = "th-TH", digit: number = 2): string => {
  // Convert string inputs to number
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    throw new Error("Invalid number or string value");
  }
  // Use Intl.NumberFormat for professional currency formatting
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  }).format(num);
}

// Helper function to format price with currency, locale, digit, and compact 
export const formatPriceWithCompact = (value: number | string, currency: string = "THB", locale: string = "th-TH", digit: number = 2): string => {
  // Convert string inputs to number
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    throw new Error("Invalid number or string value");
  }

  const absNum = Math.abs(num);

  // Compact format (100K, 1.2M, etc.)
  if (absNum >= 100000) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      compactDisplay: "short",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(num);
  }

  // Normal currency format
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  }).format(num);
};

// Helper function to format number with comma separators
export const formatNumberWithComma = (
  value: number | string,
  locale: string = "en-US",
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 2
): string => {
  // Convert string inputs to number
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) {
    throw new Error("Invalid number or string value");
  }
  // Use Intl.NumberFormat for comma-separated number formatting
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
};

// v2.0 - Updated formatDateTime to handle invalid date inputs gracefully and return empty string
export const formatToLocalInput = (value?: string | Date): string => {
  if (!value) {
    return "";
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// v1.0 - Initial implementation of formatToLocalInput
// const formatToLocalInput = (value?: string | Date): string => {
//   if (!value) {
//     const date = new Date();
//     const pad = (n: number) => n.toString().padStart(2, "0");
//     return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
//       date.getDate()
//     )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
//   }
//   const date = typeof value === "string" ? new Date(value) : value;
//   if (isNaN(date.getTime())) {
//     return "";
//   }
//   const pad = (n: number) => n.toString().padStart(2, "0");
//   return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
//     date.getUTCDate()
//   )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
// };

// Helper function to determine CSS class for column span based on field configuration
export const getColSpanClass = (field: Column<unknown> | FieldConfig): string => {
  // Support both new colSpan and legacy gridColumn
  if (field.colSpan === 2 || field.gridColumn === "full") {
    return "col-span-1 md:col-span-2";
  }
  if (field.colSpan === 1 || field.gridColumn === "half") {
    return "col-span-1";
  }
  // Default to full width
  return "col-span-1 md:col-span-2";
};

// Helper function to group fields into image, top-right, and rest based on configuration
export const getFieldGroups = (fields: FieldConfig[], customFieldGroup: string[]) => {
  const imageField = fields.find(f => f.type === "file");
  const topRightFields = fields.filter(f =>
    customFieldGroup.includes(f.name)
  );
  const restFields = fields.filter(f =>
    ![imageField?.name, ...customFieldGroup].includes(f.name)
  );
  return {
    imageField,
    topRightFields,
    restFields
  };
};

// Helper function to determine request status based on quantity
export const getRequestStatus = (qty: number) => {
  if (qty > LOW_STOCK_THRESHOLD) {
    return { color: "red", variant: "error" };
  }
  if (qty > 0 && qty <= LOW_STOCK_THRESHOLD) {
    return { color: "yellow", variant: "warning" };
  }
  return { color: "green", variant: "success" };
}

// Helper function to determine stock status based on quantity
export const getStockStatus = (qty: number) => {
  const { t } = Translation();
  if (qty > LOW_STOCK_THRESHOLD) {
    return { label: t("crud.common.unit.in_stock"), color: "green", variant: "success" };
  }
  if (qty > 0 && qty <= LOW_STOCK_THRESHOLD) {
    return { label: t("crud.common.unit.low_stock"), color: "yellow", variant: "warning" };
  }
  return { label: t("crud.common.unit.out_of_stock"), color: "red", variant: "error" };
}

// Helper function to convert local datetime string to UTC ISO string
export const keepRaw = (iso: string | Date) => (iso instanceof Date ? iso.toISOString() : iso).slice(0, 16);

// Helper function to convert ISO datetime string to local input format (YYYY-MM-DDTHH:mm)
export const toLocalInputString = (iso: string) => {
  const date = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Helper function to convert local datetime string to UTC ISO string
export const toUTCISOString = (local: string) => {
  return new Date(local).toISOString();
};
