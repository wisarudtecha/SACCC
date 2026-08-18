// /src/components/admin/system-configuration/unit/unit-form/sections/StatusSection.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UnitFormData } from "@/cms/types/unit";
import Label from "@/core/components/form/Label";
import Checkbox from "@/core/components/form/input/Checkbox";
import Input from "@/core/components/form/input/InputField";

interface StatusSectionProps {
  errors: Partial<Record<keyof UnitFormData, string>>;
  formData: UnitFormData;
  onChange: (field: keyof UnitFormData, value: unknown) => void;
}

const StatusSection: React.FC<StatusSectionProps> = ({
  errors,
  formData,
  onChange
}) => {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 cursor-default">
        {t("crud.unit.form.status_and_health.header")}
      </h3>

      <div className="gap-4 grid grid-cols-1 xl:grid-cols-4">
        <div>
          <Label htmlFor="healthChk">
            {t("crud.unit.form.status_and_health.sections.healthChk.label")}
          </Label>
          <Input
            id="healthChk"
            value={formData.healthChk || ""}
            onChange={e => onChange("healthChk", e.target.value)}
            placeholder={t("crud.unit.form.status_and_health.sections.healthChk.placeholder")}
            error={!!errors.healthChk}
          />
        </div>

        {/*
        <div>
          <Label htmlFor="healthChkTime">
            {t("crud.unit.form.status_and_health.sections.healthChkTime.label")}
          </Label>
          <Input
            type="datetime-local"
            id="healthChkTime"
            value={formData.healthChkTime.replace("Z", "")}
            onChange={e => onChange("healthChkTime", e.target.value)}
            placeholder={t("crud.unit.form.status_and_health.sections.healthChkTime.placeholder")}
            error={!!errors.healthChkTime}
          />
        </div>
        */}

        <div>
          <Label htmlFor="sttId">
            {t("crud.unit.form.status_and_health.sections.sttId.label")}
          </Label>
          <Input
            id="sttId"
            value={formData.sttId || ""}
            onChange={e => onChange("sttId", e.target.value)}
            placeholder={t("crud.unit.form.status_and_health.sections.sttId.placeholder")}
            error={!!errors.sttId}
          />
        </div>
      </div>

      <div className="gap-4 grid grid-cols-1 xl:grid-cols-4">
        <div className="mt-4">
          <Checkbox
            label={t("crud.unit.form.status_and_health.sections.active.label")}
            checked={formData.active}
            onChange={checked => onChange("active", checked)}
          />
        </div>

        <div className="mt-4">
          <Checkbox
            label={t("crud.unit.form.status_and_health.sections.isFreeze.label")}
            checked={formData?.isFreeze || false}
            onChange={checked => onChange("isFreeze", checked)}
          />
        </div>

        <div className="mt-4">
          <Checkbox
            label={t("crud.unit.form.status_and_health.sections.isLogin.label")}
            checked={formData?.isLogin || false}
            onChange={checked => onChange("isLogin", checked)}
          />
        </div>

        <div className="mt-4">
          <Checkbox
            label={t("crud.unit.form.status_and_health.sections.isOutArea.label")}
            checked={formData?.isOutArea || false}
            onChange={checked => onChange("isOutArea", checked)}
          />
        </div>
      </div>
    </>
  );
};

export default StatusSection;
