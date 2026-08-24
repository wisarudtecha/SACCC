// /src/cms/types/areaTemplate.ts
// ===================================================================
// Area templates
// ===================================================================
// Shapes for the AreaTemplate GraphQL root (see src/cms/mocks/areaTemplateCURL.sh).
//
// An area template is a versioned, publishable copy of a country/province/district
// hierarchy that carries real polygon geometry. Templates are edited as drafts,
// locked by publishing, and forked into a new draft version to change again.
// An organization takes one on via CreateOrgAreaFromTemplateCountry (first import)
// or SyncTemplateCountry (subsequent merges).
//
// Adopting a template is one way an org gets geometry, not the only one: the
// org-level write inputs accept `coordinates` directly, so an org area can also
// be authored by hand. A record that came from a template is identifiable by its
// `sourceTemplateId` (see Country/AreaProvince/AreaDistrict in @/cms/types/area).

import type {
  AreaAuditFields,
  AreaCountryTree,
  PolygonCoordinates
} from "@/cms/types/area";

/** A template is editable while "draft"; publishing locks it against further edits. */
export type TemplateStatus = "draft" | "published";

/**
 * SyncTemplateCountry merge strategies.
 * "replace_coodinates" is the backend's spelling - it is the wire value, not a
 * typo to fix here. Correcting it would silently stop matching the API.
 */
export type SyncTemplateMode =
  | "merge"
  | "replace_all"
  | "replace_label"
  | "replace_coodinates";

// ===================================================================
// Records
// ===================================================================

export interface TemplateCountry extends AreaAuditFields {
  id: number;
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace?: string | null;
  coordinates?: PolygonCoordinates | null;
  yearOfData?: number | null;
  shapeArea?: number | null;
  shapeLength?: number | null;
  version: number;
  status: TemplateStatus;
  // Lineage: parentTemplateId is the version this one was forked from,
  // rootTemplateId the original. Both null on a v1 template.
  parentTemplateId?: number | null;
  rootTemplateId?: number | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
}

export interface TemplateProvince extends AreaAuditFields {
  id: number;
  templateCountryId: number;
  countryId: string;
  provId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace?: string | null;
  coordinates?: PolygonCoordinates | null;
}

export interface TemplateDistrict extends AreaAuditFields {
  id: number;
  templateProvinceId: number;
  countryId: string;
  provId: string;
  distId: string;
  en: string;
  th: string;
  postcode?: string | null;
  active: boolean;
  nameSpace?: string | null;
  coordinates?: PolygonCoordinates | null;
}

/**
 * GetTemplateCountryTree - the cached nested tree for one template version.
 * Node shape is shared with the org tree (AreaCountryTree); a template tree
 * additionally always reports its lineage version and draft/published status.
 */
export type TemplateCountryTree = AreaCountryTree & {
  version: number;
  status: TemplateStatus;
};

// ===================================================================
// Write payloads
// ===================================================================

export interface TemplateCountryCreateData {
  countryId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace: string;
  coordinates?: PolygonCoordinates | null;
  yearOfData?: number | null;
  shapeArea?: number | null;
  shapeLength?: number | null;
}

export interface TemplateCountryUpdateData extends TemplateCountryCreateData {
  id: number;
}

export interface TemplateProvinceCreateData {
  templateCountryId: number;
  countryId: string;
  provId: string;
  en: string;
  th: string;
  active: boolean;
  nameSpace: string;
  coordinates?: PolygonCoordinates | null;
}

// Update identifies the row by id and does not re-parent it, so the update
// payload drops templateCountryId (matches UpdateTemplateProvince's variables).
export interface TemplateProvinceUpdateData
  extends Omit<TemplateProvinceCreateData, "templateCountryId"> {
  id: number;
}

export interface TemplateDistrictCreateData {
  templateProvinceId: number;
  countryId: string;
  provId: string;
  distId: string;
  en: string;
  th: string;
  postcode: string;
  active: boolean;
  nameSpace: string;
  coordinates?: PolygonCoordinates | null;
}

// Same as province: UpdateTemplateDistrict does not re-parent.
export interface TemplateDistrictUpdateData
  extends Omit<TemplateDistrictCreateData, "templateProvinceId"> {
  id: number;
}

/** ForkTemplateCountry - `en` names the new draft version. */
export interface ForkTemplateData {
  en: string;
}

/** SyncTemplateCountry - `id` is the org area country, in the path. */
export interface SyncTemplateData {
  templateCountryId: number;
  mode: SyncTemplateMode;
}

/** CreateOrgAreaFromTemplateCountry - duplicates a template into the org's area. */
export interface FromTemplateCountryData {
  templateCountryId: number;
}

// ===================================================================
// List query params
// ===================================================================

export interface TemplateProvinceListParams {
  templateCountryId: number;
}

export interface TemplateDistrictListParams {
  templateProvinceId: number;
}
