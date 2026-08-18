// src/cms/components/admin/system-configuration/unit/unit-form/sections/OrganizationSection.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { INTERNAL_UNIT_SOURCE_ID } from "@/cms/utils/constants";
import type { UnitFormData } from "@/cms/types/unit";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import Label from "@/core/components/form/Label";

interface OrganizationSectionProps {
  commands: { value: string; label: string }[];
  companies: { value: string; label: string }[];
  departments: { value: string; label: string }[];
  errors: Partial<Record<keyof UnitFormData, string>>;
  formData: UnitFormData;
  // provinces: { value: string; label: string }[];
  sources: { value: string; label: string }[];
  stations: { value: string; label: string }[];
  onChange: (field: keyof UnitFormData, value: unknown) => void;
}

const OrganizationSection: React.FC<OrganizationSectionProps> = ({
  commands,
  companies,
  departments,
  // errors,
  formData,
  // provinces,
  sources,
  stations,
  onChange
}) => {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 cursor-default">
        {t("crud.unit.form.organization_details.header")}
      </h3>

      <div className="gap-4 grid grid-cols-1 xl:grid-cols-4 mb-4">
        <div>
          <Label>
            {t("crud.unit.form.basic_information.sections.unitSourceId.label")}
          </Label>
          <CustomizableSelect
            options={sources}
            value={formData.unitSourceId}
            onChange={value => {
              onChange("stnId", "");
              onChange("commId", "");
              onChange("deptId", "");
              onChange("compId", "");
              onChange("unitSourceId", value);
            }}
            placeholder={t("crud.unit.form.basic_information.sections.unitSourceId.placeholder")}
            multiple={false}
          />
        </div>
      </div>
      
      <div className="gap-4 grid grid-cols-1 xl:grid-cols-4">
        <div>
          <Label>
            {t("crud.unit.form.organization_details.sections.compId.label")}
          </Label>
          <CustomizableSelect
            options={companies}
            value={formData.compId}
            onChange={value => {
              onChange("compId", value);
            }}
            placeholder={t("crud.unit.form.organization_details.sections.compId.placeholder")}
            multiple={false}
            disabled={!formData.unitSourceId}
          />
        </div>

        <div>
          <Label>
            {t("crud.unit.form.organization_details.sections.deptId.label")}
          </Label>
          <CustomizableSelect
            options={departments}
            value={formData.deptId}
            onChange={value => {
              onChange("stnId", "");
              onChange("commId", "");
              onChange("deptId", value);
            }}
            placeholder={t("crud.unit.form.organization_details.sections.deptId.placeholder")}
            multiple={false}
            disabled={!formData.unitSourceId || !INTERNAL_UNIT_SOURCE_ID.includes(formData.unitSourceId as (typeof INTERNAL_UNIT_SOURCE_ID)[number])}
          />
        </div>

        <div>
          <Label>
            {t("crud.unit.form.organization_details.sections.commId.label")}
          </Label>
          <CustomizableSelect
            options={commands}
            value={formData.commId}
            onChange={value => {
              onChange("stnId", "");
              onChange("commId", value);
            }}
            placeholder={t("crud.unit.form.organization_details.sections.commId.placeholder")}
            multiple={false}
            disabled={!formData.deptId || !INTERNAL_UNIT_SOURCE_ID.includes(formData.unitSourceId as (typeof INTERNAL_UNIT_SOURCE_ID)[number])}
          />
        </div>

        <div>
          <Label>
            {t("crud.unit.form.organization_details.sections.stnId.label")}
          </Label>
          <CustomizableSelect
            options={stations}
            value={formData.stnId}
            onChange={value => onChange("stnId", value)}
            placeholder={t("crud.unit.form.organization_details.sections.stnId.placeholder")}
            multiple={false}
            disabled={!formData.commId || !INTERNAL_UNIT_SOURCE_ID.includes(formData.unitSourceId as (typeof INTERNAL_UNIT_SOURCE_ID)[number])}
          />
        </div>
      </div>
    </>
  );
};

export default OrganizationSection;
