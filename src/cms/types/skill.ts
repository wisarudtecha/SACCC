// /src/types/skill.ts
import type { BaseEntity } from "@/core/types";

export interface Skill extends BaseEntity {
  orgId: string;
  skillId: string;
  en: string;
  th: string;
  active: boolean;
}

export interface SkillCreateData {
  active: boolean;
  en: string;
  th: string;
}

export interface SkillQueryParams {
  start?: number | 0;
  length?: number | 10;
}

export interface SkillUpdateData {
  active: boolean;
  en: string;
  th: string;
}

export interface SkillManagementProps {
  skills?: Skill[];
}
