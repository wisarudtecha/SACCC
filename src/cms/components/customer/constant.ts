// export const userType = [{ name: "Bronze", id: "1" }, { name: "Silver", id: "2" }, { name: "Gold", id: "3" }, { name: "Platinum", id: "4" }]

import { TranslationParams } from "@/core/types/i18n";



export const userType: Record<string, string> = {
    "1": "Bronze",
    "2": "Silver",
    "3": "Gold",
    "4": "Platinum"
};

export const i18nUserType = (
  t: (key: string, params?: TranslationParams | undefined) => string,
  typeKey: string
) => {
  const label = userType[typeKey];
  return label?t("customer.userType." + label.toLowerCase()):"";
};

/**
 * The channel a customer prefers to be contacted on — and, since it outranks the stored
 * `CustomerContactDefault`, the field that decides which contact row carries the Primary
 * badge (`resolvePrimaryChannelKey` in `utils/customerSocial.policy.ts`).
 *
 * `FACEBOOK` and `TEXTCHAT` match the `CustomerSocial.socialType` strings exactly, which is
 * what keeps the preference-to-channel mapping a straight comparison rather than a second
 * translation table. `CALL` and `SMS` are the two that don't map one-to-one: both mean "a
 * phone number", and which of the two is wanted is not something a stored number can say.
 */
export const CONTRACT_PREFERENCE_OPTIONS = [
  { value: "CALL", label: "CALL" },
  { value: "SMS", label: "SMS" },
  { value: "Email", label: "Email" },
  { value: "LINE", label: "LINE" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "TEXTCHAT", label: "Text Chat" },
];

export const LANGUAGE_PREFERENCE_OPTIONS = [
  { value: "th-TH", label: "Thai" },
  { value: "en-US", label: "English" },
  { value: "zh-Hans", label: "Mandarin Chinese (Simplified)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "es-ES", label: "Spanish" },
  { value: "ar", label: "Standard Arabic" },
  { value: "fr-FR", label: "French" },
  { value: "bn-BD", label: "Bengali" },
  { value: "pt-BR", label: "Portuguese" },
  { value: "id-ID", label: "Indonesian" },
  { value: "ur-PK", label: "Urdu" },
  { value: "de-DE", label: "German" },
  { value: "ja-JP", label: "Japanese" },
  { value: "pcm-NG", label: "Nigerian Pidgin" },
  { value: "mr-IN", label: "Marathi" },
  { value: "te-IN", label: "Telugu" },
  { value: "tr-TR", label: "Turkish" },
  { value: "ta-IN", label: "Tamil" },
  { value: "yue-Hant-HK", label: "Cantonese" },
  { value: "vi-VN", label: "Vietnamese" },
  { value: "fil-PH", label: "Filipino (Tagalog)" },
  { value: "wuu-CN", label: "Shanghainese (Wu Chinese)" },
  { value: "ko-KR", label: "Korean" },
  { value: "fa-IR", label: "Persian (Farsi)" },
  { value: "ha-NG", label: "Hausa" },
  { value: "arz-EG", label: "Egyptian Arabic" },
  { value: "sw-TZ", label: "Swahili" },
  { value: "jv-ID", label: "Javanese" },
  { value: "pa-PK", label: "Western Punjabi" },
  { value: "it-IT", label: "Italian" },
  { value: "", label: "Other" },
];