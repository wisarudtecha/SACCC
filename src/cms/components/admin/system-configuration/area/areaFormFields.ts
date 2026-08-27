// /src/cms/components/admin/system-configuration/area/areaFormFields.ts
/**
 * Field descriptors for the three area forms.
 *
 * AreaFormModal renders whatever these builders describe - which fields, in
 * which section, at which width - so a layout change is an edit here rather
 * than JSX surgery in the modal. They live outside AreaManagement because the
 * three arrays were ~230 lines of the page's ~1,200, and the page is already
 * carrying every piece of form state besides.
 *
 * Every builder is pure: values in, descriptors out. They describe fields only -
 * the consequences of changing a code or a parent are warned about at
 * confirmation time in AreaManagement, where the values can be compared against
 * the record the form was loaded with and a warning therefore means something
 * actually changed.
 */
import type { AreaFormField } from "@/cms/components/admin/system-configuration/area/AreaFormModal";

type Translate = (key: string) => string;

interface SelectOption {
  value: string;
  label: string;
}

/** Province options carry their country so the district form can scope them. */
interface ProvinceSelectOption extends SelectOption {
  countryId: string;
}

/**
 * Section headings. Ordering here is the ordering on screen - see the grouping
 * note in AreaFormModal.
 */
const groups = (t: Translate) => ({
  identity: t("crud.area.form.group.identity"),
  boundary: t("crud.area.form.group.boundary"),
  status: t("crud.area.form.group.status")
});

export interface CountryFieldsArgs {
  t: Translate;
  countryCode: string;
  countryTh: string;
  countryEn: string;
  countryYearOfData: string;
  countryShapeArea: string;
  countryShapeLength: string;
  countryNameSpace: string;
  countryActive: boolean;
  countryCoordinatesText: string;
  countryValidateErrors: {
    countryCode: string;
    countryTh: string;
    countryEn: string;
    coordinates: string;
  };
  setCountryCode: (value: string) => void;
  setCountryTh: (value: string) => void;
  setCountryEn: (value: string) => void;
  setCountryYearOfData: (value: string) => void;
  setCountryShapeArea: (value: string) => void;
  setCountryShapeLength: (value: string) => void;
  setCountryNameSpace: (value: string) => void;
  setCountryActive: (value: boolean) => void;
  setCountryCoordinatesText: (value: string) => void;
}

export const buildCountryFields = ({
  t,
  countryCode,
  countryTh,
  countryEn,
  countryYearOfData,
  countryShapeArea,
  countryShapeLength,
  countryNameSpace,
  countryActive,
  countryCoordinatesText,
  countryValidateErrors,
  setCountryCode,
  setCountryTh,
  setCountryEn,
  setCountryYearOfData,
  setCountryShapeArea,
  setCountryShapeLength,
  setCountryNameSpace,
  setCountryActive,
  setCountryCoordinatesText
}: CountryFieldsArgs): AreaFormField[] => {
  const group = groups(t);

  return [
    {
      key: "countryCode",
      type: "text",
      group: group.identity,
      span: "third",
      label: t("crud.area.form.country.countryCode.label"),
      placeholder: t("crud.area.form.country.countryCode.placeholder"),
      value: countryCode,
      error: countryValidateErrors.countryCode,
      onChange: setCountryCode
    },
    {
      key: "countryTh",
      type: "text",
      group: group.identity,
      span: "third",
      label: t("crud.area.form.country.countryTh.label"),
      placeholder: t("crud.area.form.country.countryTh.placeholder"),
      value: countryTh,
      error: countryValidateErrors.countryTh,
      onChange: setCountryTh
    },
    {
      key: "countryEn",
      type: "text",
      group: group.identity,
      span: "third",
      label: t("crud.area.form.country.countryEn.label"),
      placeholder: t("crud.area.form.country.countryEn.placeholder"),
      value: countryEn,
      error: countryValidateErrors.countryEn,
      onChange: setCountryEn
    },
    {
      key: "countryYearOfData",
      type: "number",
      group: group.boundary,
      span: "third",
      label: t("crud.areaTemplate.field.yearOfData.label"),
      placeholder: t("crud.areaTemplate.field.yearOfData.placeholder"),
      value: countryYearOfData,
      onChange: setCountryYearOfData
    },
    {
      key: "countryShapeArea",
      type: "number",
      group: group.boundary,
      span: "third",
      label: t("crud.area.form.country.shapeArea.label"),
      placeholder: t("crud.area.form.country.shapeArea.placeholder"),
      value: countryShapeArea,
      // Metrics quoted from whatever dataset the boundary came from. Nothing
      // recalculates them from the rings below, so an edited boundary and a
      // stale shape metric can disagree - hence saying where they come from.
      hint: t("crud.area.form.country.shapeArea.hint"),
      onChange: setCountryShapeArea
    },
    {
      key: "countryShapeLength",
      type: "number",
      group: group.boundary,
      span: "third",
      label: t("crud.area.form.country.shapeLength.label"),
      placeholder: t("crud.area.form.country.shapeLength.placeholder"),
      value: countryShapeLength,
      hint: t("crud.area.form.country.shapeLength.hint"),
      onChange: setCountryShapeLength
    },
    {
      key: "countryCoordinates",
      type: "geometry",
      group: group.boundary,
      span: "full",
      label: t("crud.areaTemplate.field.coordinates.label"),
      placeholder: t("crud.areaTemplate.field.coordinates.placeholder"),
      value: countryCoordinatesText,
      error: countryValidateErrors.coordinates,
      hint: t("crud.area.form.geometry.hint"),
      onChange: setCountryCoordinatesText
    },
    {
      key: "countryNameSpace",
      type: "text",
      group: group.status,
      label: t("crud.area.form.nameSpace.label"),
      placeholder: t("crud.area.form.nameSpace.placeholder"),
      value: countryNameSpace,
      onChange: setCountryNameSpace
    },
    {
      key: "countryActive",
      type: "toggle",
      group: group.status,
      label: t("crud.area.form.active.label"),
      placeholder: t("crud.area.form.active.placeholder"),
      value: String(countryActive),
      onChange: value => setCountryActive(value === "true")
    }
  ];
};

export interface ProvinceFieldsArgs {
  t: Translate;
  countriesOptions: SelectOption[];
  provinceCode: string;
  provCountryId: string;
  provinceTh: string;
  provinceEn: string;
  provinceNameSpace: string;
  provinceActive: boolean;
  provinceCoordinatesText: string;
  provValidateErrors: {
    provinceCode: string;
    countryId: string;
    provinceTh: string;
    provinceEn: string;
    coordinates: string;
  };
  setProvinceCode: (value: string) => void;
  setProvCountryId: (value: string) => void;
  setProvinceTh: (value: string) => void;
  setProvinceEn: (value: string) => void;
  setProvinceNameSpace: (value: string) => void;
  setProvinceActive: (value: boolean) => void;
  setProvinceCoordinatesText: (value: string) => void;
}

export const buildProvinceFields = ({
  t,
  countriesOptions,
  provinceCode,
  provCountryId,
  provinceTh,
  provinceEn,
  provinceNameSpace,
  provinceActive,
  provinceCoordinatesText,
  provValidateErrors,
  setProvinceCode,
  setProvCountryId,
  setProvinceTh,
  setProvinceEn,
  setProvinceNameSpace,
  setProvinceActive,
  setProvinceCoordinatesText
}: ProvinceFieldsArgs): AreaFormField[] => {
  const group = groups(t);

  return [
    {
      key: "provinceCountryId",
      type: "select",
      group: group.identity,
      span: "quarter",
      label: t("crud.area.form.province.provinceCountryId.label"),
      placeholder: t("crud.area.form.province.provinceCountryId.placeholder"),
      value: provCountryId,
      error: provValidateErrors.countryId,
      options: countriesOptions,
      onChange: setProvCountryId
    },
    {
      key: "provinceCode",
      type: "text",
      group: group.identity,
      span: "quarter",
      label: t("crud.area.form.province.provinceCode.label"),
      placeholder: t("crud.area.form.province.provinceCode.placeholder"),
      value: provinceCode,
      error: provValidateErrors.provinceCode,
      onChange: setProvinceCode
    },
    {
      key: "provinceTh",
      type: "text",
      group: group.identity,
      span: "quarter",
      label: t("crud.area.form.province.provinceTh.label"),
      placeholder: t("crud.area.form.province.provinceTh.placeholder"),
      value: provinceTh,
      error: provValidateErrors.provinceTh,
      onChange: setProvinceTh
    },
    {
      key: "provinceEn",
      type: "text",
      group: group.identity,
      span: "quarter",
      label: t("crud.area.form.province.provinceEn.label"),
      placeholder: t("crud.area.form.province.provinceEn.placeholder"),
      value: provinceEn,
      error: provValidateErrors.provinceEn,
      onChange: setProvinceEn
    },
    {
      key: "provinceCoordinates",
      type: "geometry",
      group: group.boundary,
      span: "full",
      label: t("crud.areaTemplate.field.coordinates.label"),
      placeholder: t("crud.areaTemplate.field.coordinates.placeholder"),
      value: provinceCoordinatesText,
      error: provValidateErrors.coordinates,
      hint: t("crud.area.form.geometry.hint"),
      onChange: setProvinceCoordinatesText
    },
    {
      key: "provinceNameSpace",
      type: "text",
      group: group.status,
      label: t("crud.area.form.nameSpace.label"),
      placeholder: t("crud.area.form.nameSpace.placeholder"),
      value: provinceNameSpace,
      onChange: setProvinceNameSpace
    },
    {
      key: "provinceActive",
      type: "toggle",
      group: group.status,
      label: t("crud.area.form.active.label"),
      placeholder: t("crud.area.form.active.placeholder"),
      value: String(provinceActive),
      onChange: value => setProvinceActive(value === "true")
    }
  ];
};

export interface DistrictFieldsArgs {
  t: Translate;
  countriesOptions: SelectOption[];
  provincesOptions: ProvinceSelectOption[];
  districtCode: string;
  distCountryId: string;
  distProvId: string;
  districtTh: string;
  districtEn: string;
  districtNameSpace: string;
  districtActive: boolean;
  districtCoordinatesText: string;
  distValidateErrors: {
    districtCode: string;
    countryId: string;
    provId: string;
    districtTh: string;
    districtEn: string;
    coordinates: string;
  };
  setDistrictCode: (value: string) => void;
  setDistCountryId: (value: string) => void;
  setDistProvId: (value: string) => void;
  setDistrictTh: (value: string) => void;
  setDistrictEn: (value: string) => void;
  setDistrictNameSpace: (value: string) => void;
  setDistrictActive: (value: boolean) => void;
  setDistrictCoordinatesText: (value: string) => void;
}

export const buildDistrictFields = ({
  t,
  countriesOptions,
  provincesOptions,
  districtCode,
  distCountryId,
  distProvId,
  districtTh,
  districtEn,
  districtNameSpace,
  districtActive,
  districtCoordinatesText,
  distValidateErrors,
  setDistrictCode,
  setDistCountryId,
  setDistProvId,
  setDistrictTh,
  setDistrictEn,
  setDistrictNameSpace,
  setDistrictActive,
  setDistrictCoordinatesText
}: DistrictFieldsArgs): AreaFormField[] => {
  const group = groups(t);

  return [
    {
      key: "districtCountryId",
      type: "select",
      group: group.identity,
      span: "third",
      label: t("crud.area.form.district.districtCountryId.label"),
      placeholder: t("crud.area.form.district.districtCountryId.placeholder"),
      value: distCountryId,
      error: distValidateErrors.countryId,
      options: countriesOptions,
      onChange: value => {
        setDistCountryId(value);
        // The province list is scoped to the country, so a stale selection here
        // would silently submit a province from a different country.
        setDistProvId("");
      }
    },
    {
      key: "districtProvId",
      type: "select",
      group: group.identity,
      span: "third",
      label: t("crud.area.form.district.districtProvId.label"),
      placeholder: t("crud.area.form.district.districtProvId.placeholder"),
      value: distProvId,
      error: distValidateErrors.provId,
      options: provincesOptions.filter(option => option.countryId === distCountryId),
      disabled: !distCountryId,
      onChange: setDistProvId
    },
    {
      key: "districtCode",
      type: "text",
      group: group.identity,
      span: "third",
      label: t("crud.area.form.district.districtCode.label"),
      placeholder: t("crud.area.form.district.districtCode.placeholder"),
      value: districtCode,
      error: distValidateErrors.districtCode,
      onChange: setDistrictCode
    },
    {
      key: "districtTh",
      type: "text",
      group: group.identity,
      label: t("crud.area.form.district.districtTh.label"),
      placeholder: t("crud.area.form.district.districtTh.placeholder"),
      value: districtTh,
      error: distValidateErrors.districtTh,
      onChange: setDistrictTh
    },
    {
      key: "districtEn",
      type: "text",
      group: group.identity,
      label: t("crud.area.form.district.districtEn.label"),
      placeholder: t("crud.area.form.district.districtEn.placeholder"),
      value: districtEn,
      error: distValidateErrors.districtEn,
      onChange: setDistrictEn
    },
    {
      key: "districtCoordinates",
      type: "geometry",
      group: group.boundary,
      span: "full",
      label: t("crud.areaTemplate.field.coordinates.label"),
      placeholder: t("crud.areaTemplate.field.coordinates.placeholder"),
      value: districtCoordinatesText,
      error: distValidateErrors.coordinates,
      hint: t("crud.area.form.geometry.hint"),
      onChange: setDistrictCoordinatesText
    },
    {
      key: "districtNameSpace",
      type: "text",
      group: group.status,
      label: t("crud.area.form.nameSpace.label"),
      placeholder: t("crud.area.form.nameSpace.placeholder"),
      value: districtNameSpace,
      onChange: setDistrictNameSpace
    },
    {
      key: "districtActive",
      type: "toggle",
      group: group.status,
      label: t("crud.area.form.active.label"),
      placeholder: t("crud.area.form.active.placeholder"),
      value: String(districtActive),
      onChange: value => setDistrictActive(value === "true")
    }
  ];
};
