import type { Language } from "@/core/config/i18n";

let jasperWin: Window | null = null;

const JASPER_REDIRECT_DELAY_MS = 1500;

const JASPER_LOCALE_BY_LANGUAGE: Record<Language, string> = {
    th: "th_TH",
    en: "en_US",
    cn: "zh_CN",
};

export function openJasperReport(url: string, language?: Language) {
    // มี window อยู่แล้ว? → ข้าม auth
    if (jasperWin && !jasperWin.closed) {
        jasperWin.location.href = url;
        jasperWin.focus();
        return;
    }

    // ไม่มี window → สร้างใหม่และทำ login
    const  jasperUrl = import.meta.env.VITE_JASPER_URL
    const form = document.createElement("form");
    form.method = "POST";
    form.action = jasperUrl+"jasperserver/j_spring_security_check";
    form.target = "jasperWin";

    // เปิดหน้าต่างใหม่ + เก็บ reference


    const params: Record<string, string> = {
        j_username: import.meta.env.VITE_JASPER_USERNAME || "" ,
        j_password_pseudo: import.meta.env.VITE_JASPER_PASSWORD || "",
        j_password: import.meta.env.VITE_JASPER_PASSWORD || "",
        userLocale: language ? JASPER_LOCALE_BY_LANGUAGE[language] : "en_US",
        userTimezone: import.meta.env.VITE_JASPER_TIMEZONE || "Asia/Bangkok",
        OWASP_CSRFTOKEN: import.meta.env.VITE_JASPER_CSRF_TOKEN || ""
    };

    for (const key in params) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = params[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);

    // Login ด้วย POST
    form.submit();

    // หลัง login แล้ว redirect → เปิด report
    setTimeout(() => {
        jasperWin = window.open(url, "jasperWin");
    }, JASPER_REDIRECT_DELAY_MS);
}
