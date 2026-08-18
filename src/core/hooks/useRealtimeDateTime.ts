// src/core/hooks/useRealtimeDateTime.ts
import { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";

export const useRealtimeDateTime = (format?: Intl.DateTimeFormatOptions) => {
  const { language } = useTranslation();
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();

      // const formatted = new Intl.DateTimeFormat(language === "th" && "th-TH" || "en-US", format || {
      //   year: "numeric",
      //   month: "2-digit",
      //   day: "2-digit",
      //   hour: "2-digit",
      //   minute: "2-digit",
      //   second: "2-digit",
      // }).format(now);

      const formatted: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "short",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: language === "th" ? false : true,
      };

      const formatter = new Intl.DateTimeFormat(language === "th" && "th-TH" || "en-UK", formatted);
      const parts = formatter.formatToParts(now);

      const year = parts.find(part => part.type === "year")?.value ?? "";
      const month = parts.find(part => part.type === "month")?.value ?? "";
      const day = parts.find(part => part.type === "day")?.value ?? "";
      const weekday = parts.find(part => part.type === "weekday")?.value ?? "";
      const hour = parts.find(part => part.type === "hour")?.value ?? "";
      const minute = parts.find(part => part.type === "minute")?.value ?? "";
      const second = parts.find(part => part.type === "second")?.value ?? "";

      setDateTime(
        language === "th" &&
        `${weekday} ${day} ${month} ${year} ${hour}:${minute}:${second}` ||
        `${weekday}, ${month} ${day}, ${year} ${hour}:${minute}:${second}`
      );
    };

    update(); // initial call
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [format, language]);

  return dateTime;
}
