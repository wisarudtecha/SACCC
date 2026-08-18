// src/cms/components/header/UserDropdown.tsx
import React, { useEffect, useRef, useState } from "react";
import { useSuperApp } from "@/core/context/SuperAppContext";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { forceSSOLogout, isSSOAvailable } from "@/core/config/api";
import { useAuth } from "@/core/hooks/useAuth";
import { useTranslation } from "@/core/hooks/useTranslation";
import { AUTO_DELETE_OPTIONS } from "@/cms/utils/constants";
import { isValidImageUrl, isValidImageUrlByContentType } from "@/core/utils/resourceValidators";
import type { Preferences, PreferencesModalProps } from "@/core/types/user";

const getInitialPreferences = (): Preferences => {
  const saved = localStorage.getItem("notification_preferences");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        popupEnabled: typeof parsed.popupEnabled === "boolean" ? parsed.popupEnabled : true,
        soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : true,
        sound: typeof parsed.sound === "string" ? parsed.sound : "default",
        pushEnabled: typeof parsed.pushEnabled === "boolean" ? parsed.pushEnabled : false,
        autoDelete: typeof parsed.autoDelete === "boolean" ? parsed.autoDelete : false,
        hideRead: typeof parsed.hideRead === "boolean" ? parsed.hideRead : false,
        autoDeleteDays: typeof parsed.autoDeleteDays === "number" ? parsed.autoDeleteDays : 7,
      };
    }
    catch {
      // 
    }
  }
  return {
    popupEnabled: true,
    soundEnabled: true,
    sound: "default",
    pushEnabled: false,
    autoDelete: false,
    hideRead: false,
    autoDeleteDays: 7,
  };
};

/* ---------- Reusable Toggle (ไม่พึ่ง peer) ---------- */
const Toggle = ({ checked, onChange, "aria-label": ariaLabel }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  "aria-label"?: string;
}) => {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
      }`}
    >
      <span
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white dark:bg-gray-800 shadow transition-transform duration-200 transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

/* ================= Preferences Dropdown ================ */
const PreferencesDropdown: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState<Preferences>(getInitialPreferences());

  const setPref = <K extends keyof Preferences>(key: K, value: Preferences[K]) => setPreferences((prev) => ({ ...prev, [key]: value }));

  const handleAutoDeleteDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPref("autoDeleteDays", Number(e.target.value));
  };

  const handleSave = () => {
    localStorage.setItem("notification_preferences", JSON.stringify(preferences));
    onClose();
  };

  const handleSoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSound = e.target.value;
    setPref("sound", selectedSound);
    const audio = new Audio(`/sounds/${selectedSound}.mp3`);
    audio.play().catch((err) => console.warn("🔇 Sound preview failed:", err));
  };

  // โหลดค่าทุกครั้งที่เปิด
  useEffect(() => {
    if (isOpen) {
      const initial = getInitialPreferences();
      setPreferences({
        ...initial,
        autoDeleteDays: typeof initial.autoDeleteDays === "number" ? initial.autoDeleteDays : 7,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-4.25 min-w-90 w-90 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-50 max-h-[90vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg text-gray-700 dark:text-gray-200">Notification Preferences</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Push + Popup */}
      <div className="mb-6 rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-500 text-xl">🔔</span>
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">Push Notifications</h3>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-700 dark:text-gray-200">Enable browser push notifications</span>
          <Toggle
            aria-label="Enable browser push notifications"
            checked={!!preferences.pushEnabled}
            onChange={(v) => setPref("pushEnabled", v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-200">Enable Notification Pop Up</span>
          <Toggle
            aria-label="Enable Notification Pop Up"
            checked={!!preferences.popupEnabled}
            onChange={(v) => setPref("popupEnabled", v)}
          />
        </div>
      </div>

      {/* Notification Sound */}
      <div className="mb-6 rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-purple-500 text-xl">🔊</span>
          <h3 className="font-semibold text-md text-gray-700 dark:text-gray-200">Notification Sound</h3>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-700 dark:text-gray-200">Enable notification sound</span>
          <Toggle
            aria-label="Enable notification sound"
            checked={!!preferences.soundEnabled}
            onChange={(v) => setPref("soundEnabled", v)}
          />
        </div>
        {preferences.soundEnabled && (
          <select
            value={preferences.sound}
            onChange={handleSoundChange}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
          >
            <option value="default">🔔 Default</option>
            <option value="ding">🎵 Ding</option>
            <option value="alert">🚨 Alert</option>
            <option value="soft">🌙 Soft</option>
          </select>
        )}
      </div>

      {/* History Settings */}
      <div className="mb-6 rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-500 text-xl">🗒️</span>
          <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">History Settings</h3>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-700 dark:text-gray-200">Auto-delete old notifications</span>
          <select
            className="w-24 border border-gray-300 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200"
            value={preferences.autoDeleteDays || 7}
            onChange={handleAutoDeleteDaysChange}
            disabled={!preferences.autoDelete}
          >
            {AUTO_DELETE_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {day} {day === 1 ? "day" : "days"}
              </option>
            ))}
          </select>
          <Toggle
            aria-label="Toggle auto delete"
            checked={!!preferences.autoDelete}
            onChange={(v) => setPref("autoDelete", v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-200">Hide read notifications</span>
          <Toggle
            aria-label="Hide read notifications"
            checked={!!preferences.hideRead}
            onChange={(v) => setPref("hideRead", v)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Close
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

/* ===================== User Dropdown ===================== */
const UserDropdown = () => {
  const isSuper = useSuperApp();

  const { t } = useTranslation();
  const { state, logout } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [photo, setPhoto] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);

  const storage = localStorage || sessionStorage;
  const profileStorage = storage?.getItem("profile") || "{}";

  const closeDropdown = () => {
    setIsOpen(false);
  }

  const closePreferencesModal = () => {
    setShowPreferences(false);
    setIsOpen(false);
  }

  const openPreferencesModal = () => {
    setShowPreferences(true);
    setIsOpen(false);
  }

  // Remove localStorge Profile || Notification || Token Data
  const removeData = () => {
    try {
      // const profileData = localStorage.getItem("profile");
      if (profileStorage) {
        const parsed = JSON.parse(profileStorage);
        const username = parsed.username;
        if (username) {
          // localStorage.removeItem(`notifications`);
          storage.removeItem(`notifications`);
        }
      }
      // localStorage.removeItem("profile");
      storage.removeItem(`profile`);
      // localStorage.removeItem("access_token");
      storage.removeItem(`access_token`);
    }
    catch (error) {
      console.error("Remove data failed:", error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }

  const handleLogoutClick = () => {
    removeData();
    forceSSOLogout();
    logout();
  };

  useEffect(() => {
    // const profileStr = localStorage.getItem("profile");
    if (profileStorage) {
      try {
        const profile = JSON.parse(profileStorage);
        setDisplayName(profile.displayName || "");
        setFullName(`${profile.firstName || ""} ${profile.lastName || ""}`);
        setEmail(profile.email || "");
        setPhoto(profile.photo || "");
      }
      catch (err) {
        console.error("Error parsing profile from localStorage or sessionStorage:", err);
      }
    }
  }, [profileStorage]);

  useEffect(() => {
    const checkImageValidity = async () => {
      if (photo && (isValidImageUrl(photo) || await isValidImageUrlByContentType(photo))) {
        setPhoto(photo);
      }
    };
    checkImageValidity();
  }, [photo]);

  return (
    <div className="relative">
      {isSSOAvailable() ? (
        <button
          className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
          title={t("navigation.topbar.profile.notification")}
          onClick={openPreferencesModal}
        >
          <svg
            className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.4858 3.5L13.5182 3.5C13.9233 3.5 14.2518 3.82851 14.2518 4.23377C14.2518 5.9529 16.1129 7.02795 17.602 6.1682C17.9528 5.96567 18.4014 6.08586 18.6039 6.43667L20.1203 9.0631C20.3229 9.41407 20.2027 9.86286 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.75182 20.1714 9.75182 19.766C9.75182 18.0461 7.88983 16.9717 6.40067 17.8314C6.04945 18.0342 5.60037 17.9139 5.39767 17.5628L3.88167 14.937C3.67903 14.586 3.79928 14.1372 4.15026 13.9346C5.63949 13.0748 5.63946 10.9253 4.15025 10.0655C3.79926 9.86282 3.67901 9.41401 3.88165 9.06303L5.39764 6.43725C5.60034 6.08617 6.04943 5.96581 6.40065 6.16858C7.88982 7.02836 9.75182 5.9539 9.75182 4.23399C9.75182 3.82862 10.0804 3.5 10.4858 3.5ZM13.5182 2L10.4858 2C9.25201 2 8.25182 3.00019 8.25182 4.23399C8.25182 4.79884 7.64013 5.15215 7.15065 4.86955C6.08213 4.25263 4.71559 4.61859 4.0986 5.68725L2.58261 8.31303C1.96575 9.38146 2.33183 10.7477 3.40025 11.3645C3.88948 11.647 3.88947 12.3531 3.40026 12.6355C2.33184 13.2524 1.96578 14.6186 2.58263 15.687L4.09863 18.3128C4.71562 19.3814 6.08215 19.7474 7.15067 19.1305C7.64015 18.8479 8.25182 19.2012 8.25182 19.766C8.25182 20.9998 9.25201 22 10.4858 22H13.5182C14.7519 22 15.7518 20.9998 15.7518 19.7663C15.7518 19.2015 16.3632 18.8487 16.852 19.1309C17.9202 19.7476 19.2862 19.3816 19.9029 18.3134L21.4193 15.6869C22.0361 14.6185 21.6701 13.2523 20.6017 12.6355C20.1125 12.3531 20.1125 11.647 20.6017 11.3645C21.6701 10.7477 22.0362 9.38152 21.4193 8.3131L19.903 5.68667C19.2862 4.61842 17.9202 4.25241 16.852 4.86917C16.3632 5.15138 15.7518 4.79856 15.7518 4.23377C15.7518 3.00024 14.7519 2 13.5182 2ZM9.6659 11.9999C9.6659 10.7103 10.7113 9.66493 12.0009 9.66493C13.2905 9.66493 14.3359 10.7103 14.3359 11.9999C14.3359 13.2895 13.2905 14.3349 12.0009 14.3349C10.7113 14.3349 9.6659 13.2895 9.6659 11.9999ZM12.0009 8.16493C9.88289 8.16493 8.1659 9.88191 8.1659 11.9999C8.1659 14.1179 9.88289 15.8349 12.0009 15.8349C14.1189 15.8349 15.8359 14.1179 15.8359 11.9999C15.8359 9.88191 14.1189 8.16493 12.0009 8.16493Z"
              fill=""
            />
          </svg>
        </button>
      ) : (
        <>
          <button
            onClick={toggleDropdown}
            className={`${isSuper ? "text-[#9CA3AF] hover:text-gray-300" : "text-gray-700 dark:text-gray-400"} flex items-center dropdown-toggle`}
          >
            {photo ?
              <span className={`${isSuper ? "mr-1 h-8 w-8" : "mr-3 h-11 w-11"} overflow-hidden rounded-full`}>
                <img src={photo || "/images/notification/user.jpg"} alt="User" title={displayName} />
              </span>
            :
              <div className={`${
                isSuper ?
                  "w-8 h-8 mr-1"
                    :
                  "w-11 h-11 text-xl mr-3"
                } bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold`
              }>
                <span className={`${isSuper ? "w-8" : "w-11"} text-center capitalize`}>{fullName[0]}</span>
              </div>
            }

            {isSuper ? "" :
              <span className="block mr-1 font-medium text-theme-sm">{displayName}</span>
            }

            <svg
              className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              width="18"
              height="20"
              viewBox="0 0 18 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="absolute right-0 mt-4.25 flex w-65 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
          >
            <div>
              <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                {fullName}
              </span>
              <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                {email}
              </span>
            </div>

            <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
              {state.user && (
                <>
                  <li>
                    <DropdownItem
                      onItemClick={closeDropdown}
                      tag="a"
                      to="/profile"
                      className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                      <svg
                        className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
                          fill=""
                        />
                      </svg>
                      {t("navigation.topbar.profile.edit_profile")}
                    </DropdownItem>
                  </li>
                  <li>
                    <DropdownItem
                      // onItemClick={closeDropdown}
                      tag="a"
                      // to="/profile"
                      className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                    >
                      <svg
                        className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.4858 3.5L13.5182 3.5C13.9233 3.5 14.2518 3.82851 14.2518 4.23377C14.2518 5.9529 16.1129 7.02795 17.602 6.1682C17.9528 5.96567 18.4014 6.08586 18.6039 6.43667L20.1203 9.0631C20.3229 9.41407 20.2027 9.86286 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.75182 20.1714 9.75182 19.766C9.75182 18.0461 7.88983 16.9717 6.40067 17.8314C6.04945 18.0342 5.60037 17.9139 5.39767 17.5628L3.88167 14.937C3.67903 14.586 3.79928 14.1372 4.15026 13.9346C5.63949 13.0748 5.63946 10.9253 4.15025 10.0655C3.79926 9.86282 3.67901 9.41401 3.88165 9.06303L5.39764 6.43725C5.60034 6.08617 6.04943 5.96581 6.40065 6.16858C7.88982 7.02836 9.75182 5.9539 9.75182 4.23399C9.75182 3.82862 10.0804 3.5 10.4858 3.5ZM13.5182 2L10.4858 2C9.25201 2 8.25182 3.00019 8.25182 4.23399C8.25182 4.79884 7.64013 5.15215 7.15065 4.86955C6.08213 4.25263 4.71559 4.61859 4.0986 5.68725L2.58261 8.31303C1.96575 9.38146 2.33183 10.7477 3.40025 11.3645C3.88948 11.647 3.88947 12.3531 3.40026 12.6355C2.33184 13.2524 1.96578 14.6186 2.58263 15.687L4.09863 18.3128C4.71562 19.3814 6.08215 19.7474 7.15067 19.1305C7.64015 18.8479 8.25182 19.2012 8.25182 19.766C8.25182 20.9998 9.25201 22 10.4858 22H13.5182C14.7519 22 15.7518 20.9998 15.7518 19.7663C15.7518 19.2015 16.3632 18.8487 16.852 19.1309C17.9202 19.7476 19.2862 19.3816 19.9029 18.3134L21.4193 15.6869C22.0361 14.6185 21.6701 13.2523 20.6017 12.6355C20.1125 12.3531 20.1125 11.647 20.6017 11.3645C21.6701 10.7477 22.0362 9.38152 21.4193 8.3131L19.903 5.68667C19.2862 4.61842 17.9202 4.25241 16.852 4.86917C16.3632 5.15138 15.7518 4.79856 15.7518 4.23377C15.7518 3.00024 14.7519 2 13.5182 2ZM9.6659 11.9999C9.6659 10.7103 10.7113 9.66493 12.0009 9.66493C13.2905 9.66493 14.3359 10.7103 14.3359 11.9999C14.3359 13.2895 13.2905 14.3349 12.0009 14.3349C10.7113 14.3349 9.6659 13.2895 9.6659 11.9999ZM12.0009 8.16493C9.88289 8.16493 8.1659 9.88191 8.1659 11.9999C8.1659 14.1179 9.88289 15.8349 12.0009 15.8349C14.1189 15.8349 15.8359 14.1179 15.8359 11.9999C15.8359 9.88191 14.1189 8.16493 12.0009 8.16493Z"
                          fill=""
                        />
                      </svg>
                      {t("navigation.topbar.profile.account_settings")}
                    </DropdownItem>
                  </li>
                </>
              )}
              <li>
                <DropdownItem
                  onItemClick={openPreferencesModal}
                  tag="button"
                  className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 14.875 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
                      fill="currentColor"
                    />
                  </svg>
                  {t("navigation.topbar.profile.notification")}
                </DropdownItem>
              </li>
            </ul>

            {state.user && (
              <button
                className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                onClick={handleLogoutClick}
              >
                <svg
                  className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
                    fill=""
                  />
                </svg>
                {t("navigation.topbar.profile.sign_out")}
              </button>
            )}
          </Dropdown>
        </>
        )}

        <PreferencesDropdown isOpen={showPreferences} onClose={closePreferencesModal} />
    </div>
  );
}

export default UserDropdown;
