import { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { FiBell } from "react-icons/fi";
import { ConfigProvider, DatePicker, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";

import { Modal } from "@/kms/components/shared/Modal";
import type {
  BroadcastItem,
  BroadcastMutationInput,
} from "@/kms/broadcast/dtos/broadcast.dto";

interface BroadcastFormModalProps {
  isOpen: boolean;
  item: BroadcastItem | null;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: BroadcastMutationInput) => Promise<void> | void;
}

interface FormState {
  title: string;
  message: string;
  statusBroadcastId: number;
  startDate: string;
  endDate: string;
}

const emptyFormState: FormState = {
  title: "",
  message: "",
  statusBroadcastId: 1,
  startDate: "",
  endDate: "",
};

const STATUS_OPTIONS = [
  { label: "Scheduled", value: 1, color: "#f59e0b" },
  { label: "Draft", value: 2, color: "#38bdf8" },
  { label: "Published", value: 3, color: "#10b981" },
  { label: "Expired", value: 4, color: "#f43f5e" },
];

const STATUS_KEY_MAP: Record<string, number> = {
  scheduled: 1,
  draft: 2,
  published: 3,
  expired: 4,
};



const filterTheme = {
  token: {
    colorPrimary: "#3b82f6", // blue-500 — CMS primary accent
    borderRadius: 8,
    controlHeight: 38,
    fontSize: 13,
  },
  components: {
    Input: {
      activeBorderColor: "#3b82f6",
      hoverBorderColor: "#60a5fa",
    },
    Select: {
      colorPrimary: "#3b82f6",
      optionSelectedBg: "#eff6ff", // blue-50
      optionSelectedColor: "#1d4ed8", // blue-700
    },
  },
};

// Dark mode token overrides — applied via ConfigProvider when html has `dark` class
const filterThemeDark = {
  token: {
    colorBgContainer: "#1f2937", // gray-800
    colorText: "#f3f4f6",        // gray-100
    colorTextPlaceholder: "#9ca3af", // gray-400 — dimmer than text
    colorBorder: "#374151",      // gray-700
    colorBgElevated: "#374151",  // gray-700 for dropdowns (darker than option hover)
  },
  components: {
    Input: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af", // gray-400
      colorBorder: "#374151",
    },
    Select: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af", // gray-400
      colorBorder: "#374151",
      optionSelectedBg: "#1e40af", // blue-800
      optionSelectedColor: "#ffffff", // white — ensure selected option is readable
      optionActiveBg: "#374151",   // gray-700 hover bg
      optionFontSize: 13,
    },
    DatePicker: {
      colorBgContainer: "#1f2937",
      colorText: "#f3f4f6",
      colorTextPlaceholder: "#9ca3af", // gray-400
      colorBorder: "#374151",
    },
  },
};

const parseDisplayDateToISO = (displayDate: string): string => {
  if (!displayDate) return "";
  const [datePart, timePart] = displayDate.split(" ");
  const [day, month, year] = (datePart ?? "").split("/");
  if (!day || !month || !year) return "";
  const dateStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return timePart ? `${dateStr}T${timePart}` : dateStr;
};

const StatusDot = ({ color }: { color: string }) => (
  <span
    style={{ backgroundColor: color }}
    className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
  />
);

const BroadcastFormModal = ({
  isOpen,
  item,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit,
}: BroadcastFormModalProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [validationError, setValidationError] = useState<string | null>(null);





  // Detect dark mode by observing `dark` class on <html>
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const activeTheme = isDark
    ? { ...filterTheme, token: { ...filterTheme.token, ...filterThemeDark.token }, components: { ...filterTheme.components, ...filterThemeDark.components } }
    : filterTheme;





  useEffect(() => {
    if (!isOpen) return;

    if (!item) {
      setForm(emptyFormState);
      setValidationError(null);
      return;
    }

    const parsedStart = parseDisplayDateToISO(item.startDate);
    const parsedEnd = parseDisplayDateToISO(item.endDate);

    setForm({
      title: item.title,
      message: item.message,
      statusBroadcastId: STATUS_KEY_MAP[item.status] ?? 1,
      startDate: parsedStart
        ? dayjs(parsedStart).startOf("day").format("YYYY-MM-DDTHH:mm:ss")
        : "",
      endDate: parsedEnd
        ? dayjs(parsedEnd).hour(23).minute(59).second(0).format("YYYY-MM-DDTHH:mm:ss")
        : "",
    });
    setValidationError(null);
  }, [isOpen, item]);

  const handleChange = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setValidationError(null);
  };

  const handleSubmit = async () => {
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setValidationError(t("knowledge.broadcast.form.validationTitle"));
      return;
    }

    const trimmedMessage = form.message.trim();
    if (!trimmedMessage) {
      setValidationError(t("knowledge.broadcast.form.validationMessage"));
      return;
    }

    if (form.startDate && !form.endDate) {
      setValidationError(t("knowledge.broadcast.form.validationEndDateRequired"));
      return;
    }

    if (!form.startDate && form.endDate) {
      setValidationError(t("knowledge.broadcast.form.validationStartDateRequired"));
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setValidationError(t("knowledge.broadcast.form.validationDateOrder"));
      return;
    }

    await onSubmit({
      title: trimmedTitle,
      message: trimmedMessage,
      statusBroadcastId: form.statusBroadcastId,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    });
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/10";

  const datePickerStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    borderRadius: "12px",
    borderColor: "#e2e8f0",
    fontSize: "13px",
  };

  return (
    <ConfigProvider
      theme={activeTheme}
    >
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="m-4 max-w-[600px] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-[0_32px_96px_-32px_rgba(15,23,42,0.5)] dark:border-white/[0.08] dark:bg-slate-900 "
      >
        {/* className="m-4 max-w-[600px] overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-[0_32px_96px_-32px_rgba(15,23,42,0.5)] dark:border-white/[0.08] dark:bg-slate-900 rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800 dark:shadow-none " */}

        {/* top accent bar */}
        <div className="h-1 w-full bg-[linear-gradient(90deg,#38bdf8_0%,#818cf8_50%,#34d399_100%)]" />

        {/* header */}
        <div className="flex items-start gap-4 px-6 pb-5 pt-6 sm:px-7 sm:pt-7">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-100 to-indigo-100 text-sky-600 dark:border-sky-500/20 dark:from-sky-500/20 dark:to-indigo-500/15 dark:text-sky-300">
            <FiBell className="text-xl" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              {t("knowledge.broadcast.labels.entryNotice", { defaultValue: "Broadcast Manager" })}
            </p>
            <h5 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {item ? t("knowledge.broadcast.form.editTitle") : t("knowledge.broadcast.form.createTitle")}
            </h5>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("knowledge.broadcast.form.description")}
            </p>
          </div>
        </div>

        {/* divider */}
        <div className="mx-6 border-t border-slate-100 dark:border-white/[0.06] sm:mx-7" />

        {/* form body */}
        <div className="grid gap-4 px-6 py-5 sm:px-7 sm:py-6">
          {/* title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("knowledge.broadcast.form.title")}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* status */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("knowledge.broadcast.form.status")}
            </label>
            <Select
              value={form.statusBroadcastId}
              onChange={(val: number) => handleChange("statusBroadcastId", val)}
              style={{ width: "100%", height: "44px" }}
              styles={{ popup: { root: { zIndex: 999999 } } }}
              options={STATUS_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
                color: opt.color,
              }))}
              optionRender={(option) => (
                <span className="flex items-center">
                  <StatusDot color={option.data.color as string} />
                  {option.label}
                </span>
              )}
              labelRender={(props) => {
                const opt = STATUS_OPTIONS.find((o) => o.value === props.value);
                return (
                  <span className="flex items-center">
                    {opt ? <StatusDot color={opt.color} /> : null}
                    <span>{String(props.label ?? "")}</span>
                  </span>
                );
              }}
            />
          </div>

          {/* message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("knowledge.broadcast.form.message")}
            </label>
            <textarea
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-400/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
            />
          </div>

          {/* dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("knowledge.broadcast.form.startDate")}
              </label>
              <DatePicker
                value={form.startDate ? dayjs(form.startDate) : null}
                onChange={(date: Dayjs | null) =>
                  handleChange(
                    "startDate",
                    date ? date.startOf("day").format("YYYY-MM-DDTHH:mm:ss") : "",
                  )
                }
                format="DD/MM/YYYY"
                style={datePickerStyle}
                placeholder="DD/MM/YYYY"
                allowClear
                styles={{ popup: { root: { zIndex: 999999 } } }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("knowledge.broadcast.form.endDate")}
              </label>
              <DatePicker
                value={form.endDate ? dayjs(form.endDate) : null}
                onChange={(date: Dayjs | null) =>
                  handleChange(
                    "endDate",
                    date
                      ? date.hour(23).minute(59).second(0).format("YYYY-MM-DDTHH:mm:ss")
                      : "",
                  )
                }
                format="DD/MM/YYYY"
                style={datePickerStyle}
                placeholder="DD/MM/YYYY"
                allowClear
                disabledDate={(current) =>
                  form.startDate
                    ? current.isBefore(dayjs(form.startDate), "day")
                    : false
                }
                styles={{ popup: { root: { zIndex: 999999 } } }}
              />
            </div>
          </div>

          {/* validation / server error */}
          {(validationError ?? errorMessage) ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{validationError ?? errorMessage}</span>
            </div>
          ) : null}
        </div>

        {/* footer */}
        <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 px-6 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-end sm:px-7">
          <button
            onClick={onClose}
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {t("knowledge.broadcast.buttons.cancel")}
          </button>
          <button
            onClick={() => void handleSubmit()}
            type="button"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(14,165,233,0.7)] transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            {isSubmitting
              ? t("knowledge.broadcast.buttons.saving")
              : item
                ? t("knowledge.broadcast.buttons.update")
                : t("knowledge.broadcast.buttons.create")}
          </button>
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default BroadcastFormModal;
