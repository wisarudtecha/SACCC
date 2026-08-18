import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
const monthNames = {
    en: {
        full: ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"],
        simplified: ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    th: {
        full: ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
            "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"],
        simplified: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
            "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    }
} as const;

type SupportedLanguage = keyof typeof monthNames;

export default function DateStringToDateFormat(
    dateString: string,
    simplifiedMonth: boolean = false,
    language: string = "en"
): string {
    const date = new Date(dateString);


    // Validate if date is valid
    if (isNaN(date.getTime())) {
        console.warn("invail date format")
    }

    // Ensure language is supported, fallback to 'en' if not
    const supportedLanguage: SupportedLanguage =
        language in monthNames ? language as SupportedLanguage : 'en';

    // Select the correct month name array based on language and simplifiedMonth flag
    const selectedMonthNames = simplifiedMonth
        ? monthNames[supportedLanguage].simplified
        : monthNames[supportedLanguage].full;

    const year = date.getUTCFullYear();
    const month = selectedMonthNames[date.getUTCMonth()];
    const day = date.getUTCDate();

    let hour = date.getUTCHours();
    const minute = date.getUTCMinutes().toString().padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    if (supportedLanguage === 'th') {
        return `${day} ${month} ${year + 543}, ${hour}:${minute} ${ampm}`; // Thai uses Buddhist Era (+543 years)
    }

    return `${month} ${day}, ${year}, ${hour}:${minute} ${ampm}`;
}



export function DateStringToAgoFormat(dateString: string, language: string) {
    try {
        const date = new Date(dateString);
        const shiftedDate = new Date(date.getTime());
        const locale = language === 'th' ? th : undefined;
        return formatDistanceToNow(shiftedDate, {
            addSuffix: true,
            locale: locale,
        })
    } catch (error) {
        return "Invail Date";
    }
}

export function TodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const miliseconds = now.getMilliseconds().toString().padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${miliseconds}Z`;
}

export function TodayLocalDate() {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);

    const year = parts.find(part => part.type === 'year')?.value ?? '';
    const month = parts.find(part => part.type === 'month')?.value ?? '';
    const day = parts.find(part => part.type === 'day')?.value ?? '';
    const hour = parts.find(part => part.type === 'hour')?.value ?? '';
    const minute = parts.find(part => part.type === 'minute')?.value ?? '';

    return `${year}-${month}-${day}T${hour}:${minute}`;
}


export function getLocalISOString(utcTimestamp: string): string {
    const date = new Date(utcTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const convertToThaiYear = (date: Date | null): Date | null => {
    if (!date) return null;
    const thaiDate = new Date(date);
    thaiDate.setFullYear(thaiDate.getFullYear() + 543);
    return thaiDate;
};

export const convertFromThaiYear = (date: Date | null): Date | null => {
    if (!date) return null;
    const gregorianDate = new Date(date);
    gregorianDate.setFullYear(gregorianDate.getFullYear() - 543);
    return gregorianDate;
};

export const getDisplayDate = (dateString: string | undefined, language: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return language === 'th' ? convertToThaiYear(date) : date;
};

export const getTodayDate = (): Date => {
    const today = new Date();
    return today;
};

export function toDateInputString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export const getDaysDifference = (date1: Date, date2: Date): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    const diffTime = d2.getTime() - d1.getTime();
    return diffTime / (1000 * 60 * 60 * 24);
}