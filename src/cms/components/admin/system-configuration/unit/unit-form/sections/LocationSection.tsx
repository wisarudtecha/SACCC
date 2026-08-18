// /src/components/admin/system-configuration/unit/unit-form/sections/LocationSection.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { UnitFormData } from "@/cms/types/unit";
import Label from "@/core/components/form/Label";
import Input from "@/core/components/form/input/InputField";

interface LocationSectionProps {
  errors: Partial<Record<keyof UnitFormData, string>>;
  formData: UnitFormData;
  onChange: (field: keyof UnitFormData, value: unknown) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  errors,
  formData,
  onChange
}) => {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100 cursor-default">
        {t("crud.unit.form.location_information.header")}
      </h3>
      
      <div className="gap-4 grid grid-cols-1 xl:grid-cols-4">
        <div>
          <Label htmlFor="locLat">
            {t("crud.unit.form.location_information.sections.locLat.label")}
          </Label>
          <Input
            id="locLat"
            type="number"
            value={formData.locLat || 0}
            onChange={e => onChange("locLat", Number(e.target.value))}
            step={0.000001}
            error={!!errors.locLat}
          />
          <span className="text-red-500 dark:text-red-400 text-sm">{errors.locLat}</span>
        </div>

        <div>
          <Label htmlFor="locLon">
            {t("crud.unit.form.location_information.sections.locLon.label")}
          </Label>
          <Input
            id="locLon"
            type="number"
            value={formData.locLon || 0}
            onChange={e => onChange("locLon", Number(e.target.value))}
            step={0.000001}
            error={!!errors.locLon}
          />
          <span className="text-red-500 dark:text-red-400 text-sm">{errors.locLon}</span>
        </div>

        <div>
          <Label htmlFor="locAlt">
            {t("crud.unit.form.location_information.sections.locAlt.label")}
          </Label>
          <Input
            id="locAlt"
            type="number"
            value={formData.locAlt || 0}
            onChange={e => onChange("locAlt", Number(e.target.value))}
            step={0.000001}
            error={!!errors.locAlt}
          />
        </div>

        <div>
          <Label htmlFor="locAccuracy">
            {t("crud.unit.form.location_information.sections.locAccuracy.label")}
          </Label>
          <Input
            id="locAccuracy"
            type="number"
            value={formData.locAccuracy || 0}
            onChange={e => onChange("locAccuracy", Number(e.target.value))}
            step={0.01}
            error={!!errors.locAccuracy}
          />
        </div>

        <div>
          <Label htmlFor="locBearing">
            {t("crud.unit.form.location_information.sections.locBearing.label")}
          </Label>
          <Input
            id="locBearing"
            type="number"
            value={formData.locBearing || 0}
            onChange={e => onChange("locBearing", Number(e.target.value))}
            step={0.01}
            error={!!errors.locBearing}
          />
        </div>

        <div>
          <Label htmlFor="locSpeed">
            {t("crud.unit.form.location_information.sections.locSpeed.label")}
          </Label>
          <Input
            id="locSpeed"
            type="number"
            value={formData.locSpeed || 0}
            onChange={e => onChange("locSpeed", Number(e.target.value))}
            // step="0.01"
            error={!!errors.locSpeed}
          />
        </div>

        <div>
          <Label htmlFor="locSatellites">
            {t("crud.unit.form.location_information.sections.locSatellites.label")}
          </Label>
          <Input
            id="locSatellites"
            type="number"
            value={formData.locSatellites || 0}
            onChange={e => onChange("locSatellites", Number(e.target.value))}
            error={!!errors.locSatellites}
          />
        </div>

        <div>
          <Label htmlFor="locProvider">
            {t("crud.unit.form.location_information.sections.locProvider.label")}
          </Label>
          <Input
            id="locProvider"
            value={formData.locProvider || ""}
            onChange={e => onChange("locProvider", e.target.value)}
            placeholder={t("crud.unit.form.location_information.sections.locProvider.placeholder")}
            error={!!errors.locProvider}
          />
        </div>

        {/*
        <div>
          <Label htmlFor="locGpsTime">
            {t("crud.unit.form.location_information.sections.locGpsTime.label")}
          </Label>
          <Input
            id="locGpsTime"
            type="datetime-local"
            value={formData.locGpsTime.replace("Z", "")}
            onChange={e => onChange("locGpsTime", e.target.value)}
            placeholder={t("crud.unit.form.location_information.sections.locGpsTime.placeholder")}
            error={!!errors.locGpsTime}
          />
        </div>

        <div>
          <Label htmlFor="locLastUpdateTime">
            {t("crud.unit.form.location_information.sections.locLastUpdateTime.label")}
          </Label>
          <Input
            id="locLastUpdateTime"
            type="datetime-local"
            value={formData.locLastUpdateTime.replace("Z", "")}
            onChange={e => onChange("locLastUpdateTime", e.target.value)}
            placeholder={t("crud.unit.form.location_information.sections.locLastUpdateTime.placeholder")}
            error={!!errors.locLastUpdateTime}
          />
        </div>
        */}
      </div>
    </>
  );
};

export default LocationSection;
