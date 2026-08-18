import { TimeIcon, VideoIcon } from "@/core/icons";
import { BoltIcon, ListIcon } from "lucide-react";

export const statusConfig = {
  active: { icon: VideoIcon, color: "text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800", label: "Active", variants: "success" },
  inactive: { icon: ListIcon, color: "text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-800", label: "Inactive", variants: "error" },
  draft: { icon: TimeIcon, color: "text-yellow-600 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-800", label: "Draft", variants: "medium" },
  testing: { icon: BoltIcon, color: "text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-800", label: "Testing", variants: "low" }
};

export const caseStatusGroup = [
  { title: { en: "Draft", th: "แบบร่าง" }, group: ["S000"], show: false },
  { title: { en: "New", th: "เหตุใหม่" }, group: ["S001", "S002", "S009"], show: true },
  { title: { en: "Assigned", th: "มอบหมาย" }, group: ["S003"], show: true },
  { title: { en: "In-progress", th: "ดำเนินการ" }, group: ["S004", "S005", "S006", "S008", "S010", "S011", "S013", "S015", "S019"], show: true },
  { title: { en: "On-Hold", th: "หยุดไว้ชั่วคราว" }, group: [, "S018"], show: false },
  { title: { en: "Done", th: "เสร็จสิ้น" }, group: ["S016", "S012", "S017"], show: true },
  { title: { en: "Close", th: "ปิดงาน" }, group: ["S007"], show: false },
  { title: { en: "Cancel", th: "ยกเลิก" }, group: ["S014"], show: false },
]

export const delayStatus = ["S008", "S009", "S010", "S011", "S012", "S013", "S014"]

export const closeStatus = "S007"

export const cancelStatus = "S014"

export const doneStatus = "S016"

export const AcknowledgedStatus = "S003"

export const cancelAndCloseStatus = [closeStatus, cancelStatus]

export interface CaseStatusInterface {
  id: string;
  statusId: string;
  th: string;
  en: string;
  color: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export const RequestCloesStage = ["S007", "S016", "S017", "S018"]

export const unitStatusConfig = [
  {
    title: "ไม่พร้อมปฏิบัติการ",
    group: ["000"],
    variant: "light" as const,
    color: "error" as const
  },
  {
    title: "พร้อมปฏิบัติการ",
    group: ["001"],
    variant: "light" as const,
    color: "success" as const
  },
  {
    title: "ตอบรับ",
    group: ["002"],
    variant: "light" as const,
    color: "info" as const
  },
  {
    title: "กำลังเดินทาง",
    group: ["003"],
    variant: "light" as const,
    color: "warning" as const
  },
  {
    title: "ถึงที่เกิดเหตุ",
    group: ["004"],
    variant: "light" as const,
    color: "success" as const
  },
  {
    title: "ถึงที่เกิดเหตุ",
    group: ["005"],
    variant: "light" as const,
    color: "success" as const
  },
  {
    title: "ปิดเหตุ",
    group: ["006"],
    variant: "light" as const,
    color: "secondary" as const
  },
  {
    title: "ถูกสั่งการ",
    group: ["007"],
    variant: "light" as const,
    color: "primary" as const
  },
]



export const statusIdToStatusTitle = (statusId: string, language: string = "en") => {
  const status = caseStatusGroup.find(col => col.group.includes(statusId));
  if (!status) return statusId;

  return language === "th" ? status.title.th : status.title.en;
}