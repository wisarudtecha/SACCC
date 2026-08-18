// /src/components/admin/system-configuration/unit/unit-form/sections/BasicInfoSection.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UnitFormData } from "@/cms/types/unit";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import Label from "@/core/components/form/Label";
import Input from "@/core/components/form/input/InputField";

interface BasicInfoSectionProps {
  errors: Partial<Record<keyof UnitFormData, string>>;
  formData: UnitFormData;
  // provinces: { value: string; label: string }[];
  // sources: { value: string; label: string }[];
  unitTypes: { value: string; label: string }[];
  users: { value: string; label: string }[];
  onChange: (field: keyof UnitFormData, value: unknown) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  errors,
  formData,
  // provinces,
  // sources,
  unitTypes,
  users,
  onChange
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 cursor-default">
        {t("crud.unit.form.basic_information.header")}
      </h3>
      
      <div className="gap-4 grid grid-cols-1 xl:grid-cols-4">
        <div>
          <Label htmlFor="unitId">
            {t("crud.unit.form.basic_information.sections.unitId.label")}
            <span className="text-red-500 dark:text-red-400 ml-1">*</span>
          </Label>
          <Input
            id="unitId"
            value={formData.unitId || ""}
            onChange={e => onChange("unitId", e.target.value)}
            placeholder={t("crud.unit.form.basic_information.sections.unitId.placeholder")}
            required
            error={!!errors.unitId}
          />
          <span className="text-red-500 dark:text-red-400 text-sm">{errors.unitId}</span>
        </div>

        <div>
          <Label htmlFor="unitName">
            {t("crud.unit.form.basic_information.sections.unitName.label")}
            <span className="text-red-500 dark:text-red-400 ml-1">*</span>
          </Label>
          <Input
            id="unitName"
            value={formData.unitName || ""}
            onChange={e => onChange("unitName", e.target.value)}
            placeholder={t("crud.unit.form.basic_information.sections.unitName.placeholder")}
            required
            error={!!errors.unitName}
          />
          <span className="text-red-500 dark:text-red-400 text-sm">{errors.unitName}</span>
        </div>

        <div>
          <Label>
            {t("crud.unit.form.basic_information.sections.unitTypeId.label")}
          </Label>
          <CustomizableSelect
            options={unitTypes}
            value={formData.unitTypeId}
            onChange={value => onChange("unitTypeId", value)}
            placeholder={t("crud.unit.form.basic_information.sections.unitTypeId.placeholder")}
            multiple={false}
          />
        </div>

        <div>
          <Label>
            {t("crud.unit.form.basic_information.sections.username.label")}
          </Label>
          <CustomizableSelect
            options={users}
            value={formData.username}
            onChange={value => onChange("username", value)}
            placeholder={t("crud.unit.form.basic_information.sections.username.placeholder")}
            multiple={false}
          />
        </div>

        {/*
        <div>
          <Label htmlFor="priority">
            {t("crud.unit.form.basic_information.sections.priority.label")}
          </Label>
          <Input
            id="priority"
            type="number"
            value={Number(formData?.priority) || 0}
            onChange={e => onChange("priority", Number(e.target.value))}
            error={!!errors.priority}
          />
        </div>

        <div>
          <Label htmlFor="plateNo">
            {t("crud.unit.form.basic_information.sections.plateNo.label")}
          </Label>
          <Input
            id="plateNo"
            value={formData.plateNo || ""}
            onChange={e => onChange("plateNo", e.target.value)}
            placeholder={t("crud.unit.form.basic_information.sections.plateNo.placeholder")}
            error={!!errors.plateNo}
          />
        </div>

        <div>
          <Label>
            {t("crud.unit.form.organization_details.sections.provinceCode.label")}
          </Label>
          <CustomizableSelect
            options={provinces}
            value={formData.provinceCode}
            onChange={value => onChange("provinceCode", value)}
            placeholder={t("crud.unit.form.organization_details.sections.provinceCode.placeholder")}
            multiple={false}
          />
        </div>
        */}

        <div>
          <Label htmlFor="breakDuration">
            {t("crud.unit.form.basic_information.sections.breakDuration.label")}
          </Label>
          <Input
            id="breakDuration"
            type="number"
            value={Number(formData?.breakDuration) || 0}
            onChange={e => onChange("breakDuration", Number(e.target.value))}
            error={!!errors.breakDuration}
          />
        </div>
      </div>
    </>
  );
};

export default BasicInfoSection;
