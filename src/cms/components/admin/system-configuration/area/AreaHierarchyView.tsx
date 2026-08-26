// /src/components/admin/system-configuration/area/AreaHierarchyView.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIcon, FileIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { AreaCountryTree, Country } from "@/cms/types/area";
import { describeGeometry } from "@/cms/utils/areaGeometry";
import { capitalizeWords } from "@/core/utils/stringFormatters";
import type { HierarchyItem, HierarchyConfig } from "@/core/types/hierarchy";
import HierarchyView from "@/core/components/admin/HierarchyView";
import Button from "@/core/components/ui/button/Button";

// Country/Province/District ids each come from their own independent DB
// sequence, so the same raw number can legitimately identify a different
// entity per level (e.g. country id=5 and province id=5 are unrelated).
// HierarchyView's getChildItems() matches parent/child by parentId string
// alone, without checking level, so unprefixed ids would let unrelated
// same-numbered rows cross-contaminate each other's child counts/rendering.
// Namespacing every tree id by level keeps the three id-spaces disjoint.
export type AreaLevelPrefix = "country" | "province" | "district";
const compositeId = (prefix: AreaLevelPrefix, id: number) => `${prefix}:${id}`;
const stripPrefix = (id: string) => id.slice(id.indexOf(":") + 1);

/**
 * The row a write just touched, named the way the form knows it.
 *
 * Business codes, not row ids: a create response is not read for an id, and codes
 * are what both a create and an edit already carry. Parent codes are part of the
 * target because a province code is only unique within its country - matching on
 * the code alone is the same cross-contamination compositeId() exists to prevent.
 */
export interface AreaFocusTarget {
  level: AreaLevelPrefix;
  code: string;
  countryCode?: string;
  provinceCode?: string;
}

interface AreaHierarchyViewProps {
  // The org's country trees, already nested by the BFF. Replaces the three flat
  // lists this component used to re-join in the browser.
  trees: AreaCountryTree[];
  // Country list records, purely for the fields the tree payload omits -
  // currently just sourceTemplateId. Not a second source of hierarchy.
  countries: Country[];
  showInactive: boolean;
  handleCountryDelete: (id: number) => void;
  handleProvinceDelete: (id: number) => void;
  handleDistrictDelete: (id: number) => void;
  /**
   * Open the edit form for one record. The parent fetches it by id rather than
   * being handed field-by-field setters: the tree omits nameSpace entirely and is
   * a server-side cache besides, so seeding a form from it dropped whatever it
   * did not carry.
   */
  onEditRecord: (level: AreaLevelPrefix, id: number) => void;
  /**
   * Open the create form for a child of `parentId`. Parent codes come from tree
   * metadata because they are structural (which country/province the new row
   * hangs off), not record data that needs to survive a round-trip.
   */
  onCreateChild: (level: AreaLevelPrefix, parent: { countryCode?: string; provinceCode?: string }) => void;
  /** The record a write just created or edited, to be revealed in the tree. */
  focusTarget?: AreaFocusTarget | null;
  /** Whether the current user may see the edit / delete actions at all. */
  canUpdate: boolean;
  canDelete: boolean;
}

const AreaHierarchyView: React.FC<AreaHierarchyViewProps> = ({
  trees,
  countries,
  showInactive,
  handleCountryDelete,
  handleProvinceDelete,
  handleDistrictDelete,
  onEditRecord,
  onCreateChild,
  focusTarget = null,
  canUpdate,
  canDelete,
}) => {
  const { language, t } = useTranslation();

  const [deleteId, setDeleteId] = useState(0);
  const [deleteIsOpen, setDeleteIsOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteHeader, setDeleteHeader] = useState("");
  const [deleteType, setDeleteType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Flatten the nested trees into generic hierarchy items, namespacing ids via
  // compositeId() so same-numbered rows at different levels never collide.
  //
  // Parentage now comes from the tree structure itself. The previous version
  // rebuilt it by string-matching countryId/provId across three flat lists,
  // which mis-parented districts whenever two countries shared a province code -
  // walking the tree makes that class of bug unrepresentable.
  //
  // Metadata carries only what the UI reads directly: the codes create-child needs,
  // the postcode and geometry summary shown on a row, and country provenance.
  // Record data for editing is fetched by id instead - see onEditRecord.
  const sourceTemplateIdByCountry = useMemo(
    () => new Map((countries || []).map(country => [country.id, country.sourceTemplateId])),
    [countries]
  );

  const convertToHierarchyItems = useCallback((): HierarchyItem[] => {
    const items: HierarchyItem[] = [];

    (trees || []).forEach(country => {
      items.push({
        id: compositeId("country", country.id),
        parentId: null, // Explicitly set to null for root items
        name: language === "th" && country.th || capitalizeWords(country.en || ""),
        secondaryName: language === "th" && capitalizeWords(country.en || "") || country.th,
        active: country.active,
        level: 0,
        metadata: {
          countryCode: country.countryId,
          geometry: describeGeometry(country.coordinates),
          // Provenance is country-only: GetOrgCountryTree's payload has no
          // sourceTemplateId, so it comes from the country list instead. The
          // province/district equivalents would need the flat lists this page
          // deliberately stopped fetching.
          sourceTemplateId: sourceTemplateIdByCountry.get(country.id)
        }
      });

      (country.provinces || []).forEach(province => {
        items.push({
          id: compositeId("province", province.id),
          parentId: compositeId("country", country.id),
          name: language === "th" && province.th || capitalizeWords(province.en || ""),
          secondaryName: language === "th" && capitalizeWords(province.en || "") || province.th,
          active: province.active,
          level: 1,
          metadata: {
            countryCode: country.countryId,
            provinceCode: province.provId,
            geometry: describeGeometry(province.coordinates)
          }
        });

        (province.districts || []).forEach(district => {
          items.push({
            id: compositeId("district", district.id),
            parentId: compositeId("province", province.id),
            name: language === "th" && district.th || capitalizeWords(district.en || ""),
            secondaryName: language === "th" && capitalizeWords(district.en || "") || district.th,
            active: district.active,
            level: 2,
            metadata: {
              countryCode: country.countryId,
              provinceCode: province.provId,
              districtCode: district.distId,
              postcode: district.postcode,
              geometry: describeGeometry(district.coordinates)
            }
          });
        });
      });
    });

    return items;
  }, [trees, language, sourceTemplateIdByCountry]);

  const [hierarchyItems, setHierarchyItems] = useState<HierarchyItem[]>(
    convertToHierarchyItems()
  );

  // Update hierarchy items when props change
  useEffect(() => {
    setHierarchyItems(convertToHierarchyItems());
  }, [convertToHierarchyItems]);

  const handleDelete = useCallback(async (item: HierarchyItem, type: string) => {
    const confirmMessage = item?.customName || item.name || "";

    setIsLoading(true);

    setDeleteId(Number(stripPrefix(String(item.id))));
    setDeleteIsOpen(true);
    setDeleteType(type);

    if (type === "country") {
      setDeleteHeader(t("crud.area.confirm.country.delete.title"));
      setDeleteMessage(t("crud.area.confirm.country.delete.message").replace("_COUNTRY_", confirmMessage || "this country"));
    }
    else if (type === "province") {
      setDeleteHeader(t("crud.area.confirm.province.delete.title"));
      setDeleteMessage(t("crud.area.confirm.province.delete.message").replace("_PROVINCE_", confirmMessage || "this province"));
    }
    else if (type === "district") {
      setDeleteHeader(t("crud.area.confirm.district.delete.title"));
      setDeleteMessage(t("crud.area.confirm.district.delete.message").replace("_DISTRICT_", confirmMessage || "this district"));
    }

    setIsLoading(false);
  }, [t]);

  const handleDeleteSelection = (id: number, type: string) => {
    if (type === "country") {
      handleCountryDelete(id);
    }
    else if (type === "province") {
      handleProvinceDelete(id);
    }
    else if (type === "district") {
      handleDistrictDelete(id);
    }
  }

  // Event handlers (converted to work with generic hierarchy items)
  // Edit hands the id up; the parent fetches the authoritative record. Names and
  // codes are deliberately NOT passed from the tree - seeding a form from tree
  // metadata is what let nameSpace (absent from the tree payload) get blanked.
  const handleEdit = useCallback((level: AreaLevelPrefix, item: HierarchyItem) => {
    onEditRecord(level, Number(stripPrefix(String(item.id))));
  }, [onEditRecord]);

  // Read-only geometry indicator. Polygons arrive with the tree but are authored
  // in area templates, not here, so this only reports what a row carries.
  const geometryLabels = useCallback((item: HierarchyItem): string[] => {
    const labels: string[] = [];

    const geometry = item.metadata?.geometry as { hasGeometry: boolean; pointCount: number } | undefined;
    if (geometry?.hasGeometry) {
      labels.push(t("crud.areaTemplate.geometry.summary").replace("_POINTS_", String(geometry.pointCount)));
    }

    // Country rows only - see the note in convertToHierarchyItems.
    const sourceTemplateId = item.metadata?.sourceTemplateId as number | null | undefined;
    if (sourceTemplateId) {
      labels.push(t("crud.areaTemplate.provenance.from_template").replace("_ID_", String(sourceTemplateId)));
    }

    return labels;
  }, [t]);

  /**
   * Turns the form's codes into the tree id HierarchyView reveals.
   *
   * Resolved against `trees` rather than remembered from the save, because the id
   * of a newly created row only exists once the regenerated tree arrives. Until
   * then this is undefined and the reveal simply waits.
   */
  const focusId = useMemo(() => {
    if (!focusTarget) {
      return null;
    }

    const country = (trees || []).find(entry => focusTarget.level === "country"
      ? entry.countryId === focusTarget.code
      : entry.countryId === focusTarget.countryCode);
    if (!country) {
      return null;
    }
    if (focusTarget.level === "country") {
      return compositeId("country", country.id);
    }

    const province = (country.provinces || []).find(entry => focusTarget.level === "province"
      ? entry.provId === focusTarget.code
      : entry.provId === focusTarget.provinceCode);
    if (!province) {
      return null;
    }
    if (focusTarget.level === "province") {
      return compositeId("province", province.id);
    }

    const district = (province.districts || []).find(entry => entry.distId === focusTarget.code);
    return district ? compositeId("district", district.id) : null;
  }, [trees, focusTarget]);

  // Configuration for the hierarchy view
  const hierarchyConfig: HierarchyConfig = useMemo(() => ({
    maxLevels: 3,
    showInactiveLabel: true,
    displayFields: {
      primaryLabel: "name",
      secondaryLabel: "secondaryName",
      metadataFields: []
    },
    levels: [
      // Level 0 - Country
      {
        canHaveChildren: true,
        createChildLabel: t("crud.area.list.header.province.create_child"),
        emptyChildrenMessage: t("crud.area.list.header.province.no_data"),
        childCountLabel: {
          plural: t("crud.area.list.header.province.plural"),
          singular: t("crud.area.list.header.province.singular")
        },
        metadataDisplay: {
          showChildCount: true,
          showMetadata: false, // We"ll use custom formatter
          customMetadataFormatter: (item, childCount) => {
            const metadata: string[] = [];
            // Show child count with custom label
            if (childCount > 0) {
              metadata.push(`${childCount} ${childCount === 1
                ? t("crud.area.list.header.province.singular")
                : t("crud.area.list.header.province.plural")}`);
            }
            metadata.push(...geometryLabels(item));
            return metadata;
          }
        },
        styling: {
          indentSize: 32,
        },
        actions: [
          {
            label: t("crud.common.update"),
            variant: "warning",
            showWhen: () => canUpdate,
            onClick: (item) => handleEdit("country", item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
            showWhen: () => canDelete,
            onClick: (item) => handleDelete(item, "country")
          }
        ]
      },
      // Level 1 - Province
      {
        canHaveChildren: true,
        createChildLabel: t("crud.area.list.header.district.create_child"),
        emptyChildrenMessage: t("crud.area.list.header.district.no_data"),
        childCountLabel: {
          plural: t("crud.area.list.header.district.plural"),
          singular: t("crud.area.list.header.district.singular")
        },
        metadataDisplay: {
          showChildCount: true,
          showMetadata: true,
          customMetadataFormatter: (item, childCount) => {
            const metadata: string[] = [];
            // Show child count with custom label
            if (childCount > 0) {
              metadata.push(`${childCount} ${childCount === 1
                ? t("crud.area.list.header.district.singular")
                : t("crud.area.list.header.district.plural")}`);
            }
            metadata.push(...geometryLabels(item));
            return metadata;
          }
        },
        styling: {
          backgroundColor: "bg-gray-100 dark:bg-gray-800"
        },
        actions: [
          {
            label: t("crud.common.update"),
            variant: "warning",
            showWhen: () => canUpdate,
            onClick: (item) => handleEdit("province", item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
            showWhen: () => canDelete,
            onClick: (item) => handleDelete(item, "province")
          }
        ]
      },
      // Level 2 - District
      {
        canHaveChildren: false,
        icon: <FileIcon className="w-4 h-4 text-green-600 dark:text-green-300" />,
        metadataDisplay: {
          showChildCount: false,
          showMetadata: false,
          customMetadataFormatter: (item) => {
            const metadata: string[] = [];
            const postcode = item.metadata?.postcode as string | undefined;
            if (postcode) {
              metadata.push(postcode);
            }
            metadata.push(...geometryLabels(item));
            return metadata;
          }
        },
        styling: {
          backgroundColor: "bg-gray-200 dark:bg-gray-700"
        },
        actions: [
          {
            label: t("crud.common.update"),
            variant: "warning",
            showWhen: () => canUpdate,
            onClick: (item) => handleEdit("district", item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
            showWhen: () => canDelete,
            onClick: (item) => handleDelete(item, "district")
          }
        ]
      }
    ]
  }), [canUpdate, canDelete, geometryLabels, handleDelete, handleEdit, t]);

  // Creating a child needs only the parent's codes, which are structural rather
  // than record data - the new row has no id to fetch yet.
  const handleCreateChild = (parentId: string, level: number) => {
    const parentItem = hierarchyItems.find(hi => String(hi.id) === parentId);
    const countryCode = parentItem?.metadata?.countryCode as string | undefined;
    const provinceCode = parentItem?.metadata?.provinceCode as string | undefined;

    if (level === 1) {
      onCreateChild("province", { countryCode });
    }
    else if (level === 2) {
      onCreateChild("district", { countryCode, provinceCode });
    }
  };

  return (
    <>
      <HierarchyView
        config={hierarchyConfig}
        focusId={focusId}
        isLoading={isLoading}
        items={hierarchyItems}
        showInactive={showInactive}
        onCreateChild={(parentId, level) => handleCreateChild(parentId, level)}
        onLoadingChange={setIsLoading}
      />

      <Modal isOpen={deleteIsOpen} onClose={() => setDeleteIsOpen(false)} className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            {deleteHeader}
          </h3>
          <Button onClick={() => setDeleteIsOpen(false)} size="sm" variant="ghost">
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-4 text-gray-800 dark:text-gray-100">
          {deleteMessage} {deleteHeader}
        </div>
        <div className="flex items-center justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button onClick={() => setDeleteIsOpen(false)} variant="outline">{t("crud.area.confirm.button.cancel")}</Button>
            <Button onClick={() => {
              handleDeleteSelection(deleteId, deleteType);
              setDeleteIsOpen(false);
            }} variant="error">{!isLoading && t("crud.area.confirm.button.confirm") || t("crud.area.confirm.button.deleting")}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AreaHierarchyView;
