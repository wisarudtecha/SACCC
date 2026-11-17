import type { Language } from "@/core/config/i18n";

let jasperWin: Window | null = null;

const JASPER_REDIRECT_DELAY_MS = 1500;

const JASPER_LOCALE_BY_LANGUAGE: Record<Language, string> = {
    th: "th_TH",
    en: "en_US",
    cn: "zh_CN",
};

export interface JasperLogin {
    /** "<tenant>_<username>" from reportConfig.json's jasperUsernameFormat. */
    username?: string | null;
    /** The tenant's default password from reportConfig.json's jasperDefaultPasswords. */
    password?: string | null;
}

export function openJasperReport(
    url: string,
    language?: Language,
    login: JasperLogin = {},
) {
    // Jasper signs in per tenant as "<tenant>_<username>" with that tenant's
    // default password (SKYICT_wisarud.tec / Skyict@123) — both resolved from
    // reportConfig.json by resolveJasperLogin(). The password is the TENANT's,
    // never the signed-in user's own: the app does not keep that.
    const username = login.username || import.meta.env.VITE_JASPER_USERNAME || "";
    const password = login.password || import.meta.env.VITE_JASPER_PASSWORD || "";

    if (!login.username) {
        // Loud on purpose: a silent fallback would log the user in as the shared
        // account and look like a normal, correct report open.
        console.warn(
            "[report] Jasper username could not be built from the signed-in tenant and user; " +
            "falling back to the shared account from VITE_JASPER_USERNAME.",
        );
    }

    if (!login.password) {
        console.warn(
            "[report] No default Jasper password configured for this tenant " +
            "(reportConfig.json → jasperDefaultPasswords); falling back to VITE_JASPER_PASSWORD.",
        );
    }

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
        j_username: username,
        j_password_pseudo: password,
        j_password: password,
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
