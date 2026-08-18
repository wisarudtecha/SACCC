import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

export type LooseRecord = Record<string, unknown>;

export const isRecord = (value: unknown): value is LooseRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const pickFirst = <T>(
  ...values: Array<T | undefined | null>
): T | undefined => values.find((v) => v !== undefined && v !== null);

export const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const toStringValue = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

export const toNumberArray = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toNumber(item)).filter(Number.isFinite);
};

export const extractObjectPayload = (input: unknown): LooseRecord => {
  if (!isRecord(input)) return {};
  const candidate = pickFirst(input.data, input.result, input.payload, input.item);
  return isRecord(candidate) ? candidate : input;
};

export const formatDateDMY = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
};

export const formatDateDMY_N = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("T")[0].split("-");

  if (!year || !month || !day) return isoDate;

  return `${day}/${month}/${year}`;
};

// export const formatISODateTime = (isoStr: string): string => {
//   if (!isoStr) return "";
//   const d = new Date(isoStr);
//   if (isNaN(d.getTime())) return isoStr;
//   const dd = String(d.getDate()).padStart(2, "0");
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const yyyy = d.getFullYear();
//   const hh = String(d.getHours()).padStart(2, "0");
//   const min = String(d.getMinutes()).padStart(2, "0");
//   return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
// };


export const formatISODateTime = (isoStr: string | null): string => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;

  // เพิ่ม 7 ชั่วโมง
  d.setHours(d.getHours() + 7);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export const formatddMMyyyy = (isoStr: string | null): string => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;

  // เพิ่ม 7 ชั่วโมง
  d.setHours(d.getHours() + 7);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};




// export const formatISODateTime = (dateTimeStr: string): string => {
//   if (!dateTimeStr) return "";

//   const [datePart, timePart] = dateTimeStr.split(" ");
//   if (!datePart || !timePart) return dateTimeStr;

//   const [day, month, year] = datePart.split("/").map(Number);
//   const [hour, minute] = timePart.split(":").map(Number);

//   const d = new Date(year, month - 1, day, hour, minute);

//   if (isNaN(d.getTime())) return dateTimeStr;

//   // เพิ่ม 7 ชั่วโมง
//   d.setHours(d.getHours() + 7);

//   const dd = String(d.getDate()).padStart(2, "0");
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const yyyy = d.getFullYear();
//   const hh = String(d.getHours()).padStart(2, "0");
//   const min = String(d.getMinutes()).padStart(2, "0");

//   return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
// };

export const extractArrayPayload = (input: unknown): LooseRecord[] => {
  if (Array.isArray(input)) return input.filter(isRecord);
  if (!isRecord(input)) return [];
  const candidate = pickFirst(input.data, input.items, input.results, input.list);
  return Array.isArray(candidate) ? candidate.filter(isRecord) : [];
};

export const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  return toStringValue(value);
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const mapRawAttachment = (raw: LooseRecord): { name: string; path: string; sizeLabel: string; ext: string } => ({
  name: toStringValue(raw.name),
  path: toStringValue(raw.path),
  sizeLabel: typeof raw.sizeLabel === "number" ? formatBytes(raw.sizeLabel) : toStringValue(raw.sizeLabel),
  ext: toStringValue(raw.ext),
});

// ─── String helpers ───────────────────────────────────────────────────────────

export const toStringArray = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
};

// ─── Number helpers ───────────────────────────────────────────────────────────

export const toNumberOrNull = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = Number(v); return isNaN(n) ? null : n; }
  return null;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** ISO/datetime string → "DD/MM/YYYY". Returns "" on null/invalid. */
export const toFormDate = (v: string | null | undefined): string => {
  if (!v) return "";
  const iso = v.split("T")[0];
  const parts = iso.split("-");
  if (parts.length !== 3) return "";
  const [yyyy, mm, dd] = parts;
  if (!yyyy || !mm || !dd) return "";
  return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
};

/** "DD/MM/YYYY" or "DD-MM-YYYY" → dayjs object, or null if invalid. */
export const parseDateValue = (v: string): Dayjs | null => {
  //console.log('parseDateValue',v)
  if (!v) return null;
  const parts = v.split(/[/-]/);
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!yyyy || yyyy.length !== 4) return null;
  const d = dayjs(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
  return d.isValid() ? d : null;
};

// ─── Domain array helpers ─────────────────────────────────────────────────────

export const toAttachmentArray = (v: unknown): { name: string; path?: string; sizeLabel?: string }[] => {
  if (!Array.isArray(v)) return [];
  return v.map((x) => {
    if (typeof x === "string") return { name: x };
    if (typeof x === "object" && x !== null && "name" in x)
      return x as { name: string; path?: string; sizeLabel?: string };
    return null;
  }).filter((x): x is { name: string; path?: string; sizeLabel?: string } =>
    x !== null && !!(x as { name?: string }).name
  );
};

// ─── Async helpers ────────────────────────────────────────────────────────────

export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ─── UI helpers ───────────────────────────────────────────────────────────────

export const getInitials = (name: string): string =>
  name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "?";

export const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
};

export const toKeywordArray = (v: unknown): { id?: number; title: string }[] => {
  if (!Array.isArray(v)) return [];
  const mapped = v.map((x) => {
    if (typeof x === "object" && x !== null && "title" in x) return x as { id?: number; title: string };
    if (typeof x === "string") return { title: x };
    return null;
  }).filter((x): x is { id?: number; title: string } => x !== null && !!x.title);
  const seen = new Set<string>();
  return mapped.filter((x) => { if (seen.has(x.title)) return false; seen.add(x.title); return true; });
};
