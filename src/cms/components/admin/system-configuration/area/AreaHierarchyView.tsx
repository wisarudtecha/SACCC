// /src/components/admin/system-configuration/area/AreaHierarchyView.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIcon, FileIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { Country, AreaProvince, AreaDistrict } from "@/cms/types/area";
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
type AreaLevelPrefix = "country" | "province" | "district";
const compositeId = (prefix: AreaLevelPrefix, id: number) => `${prefix}:${id}`;
const stripPrefix = (id: string) => id.slice(id.indexOf(":") + 1);

interface AreaHierarchyViewProps {
  countries: Country[];
  provinces: AreaProvince[];
  districts: AreaDistrict[];
  showInactive: boolean;
  handleCountryDelete: (id: number) => void;
  handleCountryReset: () => void;
  handleProvinceDelete: (id: number) => void;
  handleProvinceReset: () => void;
  handleDistrictDelete: (id: number) => void;
  handleDistrictReset: () => void;
  setCountryId: (id: string) => void;
  setCountryIsOpen: (isOpen: boolean) => void;
  setCountryCode: (code: string) => void;
  setCountryTh: (th: string) => void;
  setCountryEn: (en: string) => void;
  setProvId: (id: string) => void;
  setProvinceIsOpen: (isOpen: boolean) => void;
  setProvinceCode: (code: string) => void;
  setProvCountryId: (countryId: string) => void;
  setProvinceTh: (th: string) => void;
  setProvinceEn: (en: string) => void;
  setDistId: (id: string) => void;
  setDistrictIsOpen: (isOpen: boolean) => void;
  setDistrictCode: (code: string) => void;
  setDistCountryId: (countryId: string) => void;
  setDistProvId: (provId: string) => void;
  setDistrictTh: (th: string) => void;
  setDistrictEn: (en: string) => void;
}

const AreaHierarchyView: React.FC<AreaHierarchyViewProps> = ({
  countries,
  provinces,
  districts,
  showInactive,
  handleCountryDelete,
  handleCountryReset,
  handleProvinceDelete,
  handleProvinceReset,
  handleDistrictDelete,
  handleDistrictReset,
  setCountryId,
  setCountryIsOpen,
  setCountryCode,
  setCountryTh,
  setCountryEn,
  setProvId,
  setProvinceIsOpen,
  setProvinceCode,
  setProvCountryId,
  setProvinceTh,
  setProvinceEn,
  setDistId,
  setDistrictIsOpen,
  setDistrictCode,
  setDistCountryId,
  setDistProvId,
  setDistrictTh,
  setDistrictEn,
}) => {
  const { language, t } = useTranslation();

  const [deleteId, setDeleteId] = useState(0);
  const [deleteIsOpen, setDeleteIsOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteHeader, setDeleteHeader] = useState("");
  const [deleteType, setDeleteType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Convert countries, provinces and districts (each carrying its own real
  // numeric id) into generic hierarchy items, namespacing ids via
  // compositeId() so same-numbered rows at different levels never collide.
  const convertToHierarchyItems = useCallback((): HierarchyItem[] => {
    const items: HierarchyItem[] = [];

    (countries || []).forEach(country => {
      items.push({
        id: compositeId("country", country.id),
        parentId: null, // Explicitly set to null for root items
        name: language === "th" && country.th || capitalizeWords(country.en || ""),
        secondaryName: language === "th" && capitalizeWords(country.en || "") || country.th,
        active: country.active,
        level: 0,
        metadata: {
          countryCode: country.countryId
        }
      });
    });

    (provinces || []).forEach(province => {
      const parentCountry = (countries || []).find(c => c.countryId === province.countryId);
      items.push({
        id: compositeId("province", province.id),
        parentId: parentCountry ? compositeId("country", parentCountry.id) : null,
        name: language === "th" && province.th || capitalizeWords(province.en || ""),
        secondaryName: language === "th" && capitalizeWords(province.en || "") || province.th,
        active: province.active,
        level: 1,
        metadata: {
          countryCode: province.countryId,
          provinceCode: province.provId
        }
      });
    });

    (districts || []).forEach(district => {
      const parentProvince = (provinces || []).find(p => p.provId === district.provId);
      items.push({
        id: compositeId("district", district.id),
        parentId: parentProvince ? compositeId("province", parentProvince.id) : null,
        name: language === "th" && district.th || capitalizeWords(district.en || ""),
        secondaryName: language === "th" && capitalizeWords(district.en || "") || district.th,
        active: district.active,
        level: 2,
        metadata: {
          countryCode: district.countryId,
          provinceCode: district.provId,
          districtCode: district.distId
        }
      });
    });

    return items;
  }, [countries, provinces, districts, language]);

  const [hierarchyItems, setHierarchyItems] = useState<HierarchyItem[]>(
    convertToHierarchyItems()
  );

  // Update hierarchy items when props change
  useEffect(() => {
    setHierarchyItems(convertToHierarchyItems());
  }, [countries, provinces, districts, convertToHierarchyItems]);

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
  const handleEditCountry = useCallback((item: HierarchyItem) => {
    handleProvinceReset();
    handleDistrictReset();
    setCountryId(stripPrefix(String(item.id)));
    setCountryCode(item.metadata?.countryCode as string || "");
    setCountryTh(language === "th" && item.name || item.secondaryName || "");
    setCountryEn(language === "th" && item.secondaryName || item.name || "");
    setCountryIsOpen(true);
    setProvinceIsOpen(false);
    setDistrictIsOpen(false);
  }, [language, handleProvinceReset, handleDistrictReset, setCountryId, setCountryCode, setCountryTh, setCountryEn, setCountryIsOpen, setProvinceIsOpen, setDistrictIsOpen]);

  const handleEditProvince = useCallback((item: HierarchyItem) => {
    handleCountryReset();
    handleDistrictReset();
    setProvId(stripPrefix(String(item.id)));
    setProvinceCode(item.metadata?.provinceCode as string || "");
    setProvinceTh(language === "th" && item.name || item.secondaryName || "");
    setProvinceEn(language === "th" && item.secondaryName || item.name || "");
    setProvCountryId(item?.metadata?.countryCode as string || "");
    setCountryIsOpen(false);
    setProvinceIsOpen(true);
    setDistrictIsOpen(false);
  }, [language, handleCountryReset, handleDistrictReset, setProvinceEn, setProvinceCode, setProvinceTh, setProvCountryId, setProvId, setProvinceIsOpen, setCountryIsOpen, setDistrictIsOpen]);

  const handleEditDistrict = useCallback((item: HierarchyItem) => {
    handleCountryReset();
    handleProvinceReset();
    setDistId(stripPrefix(String(item.id)));
    setDistrictCode(item.metadata?.districtCode as string || "");
    setDistrictTh(language === "th" && item.name || item.secondaryName || "");
    setDistrictEn(language === "th" && item.secondaryName || item.name || "");
    setDistProvId(item?.metadata?.provinceCode as string || "");
    setDistCountryId(item?.metadata?.countryCode as string || "");
    setCountryIsOpen(false);
    setProvinceIsOpen(false);
    setDistrictIsOpen(true);
  }, [language, handleCountryReset, handleProvinceReset, setDistId, setDistrictCode, setDistrictTh, setDistrictEn, setDistProvId, setDistCountryId, setCountryIsOpen, setProvinceIsOpen, setDistrictIsOpen]);

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
          customMetadataFormatter: (_, childCount) => {
            const metadata: string[] = [];
            // Show child count with custom label
            if (childCount > 0) {
              metadata.push(`${childCount} ${childCount === 1
                ? t("crud.area.list.header.province.singular")
                : t("crud.area.list.header.province.plural")}`);
            }
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
            onClick: (item) => handleEditCountry(item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
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
          customMetadataFormatter: (_, childCount) => {
            const metadata: string[] = [];
            // Show child count with custom label
            if (childCount > 0) {
              metadata.push(`${childCount} ${childCount === 1
                ? t("crud.area.list.header.district.singular")
                : t("crud.area.list.header.district.plural")}`);
            }
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
            onClick: (item) => handleEditProvince(item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
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
          customMetadataFormatter: () => {
            const metadata: string[] = [];
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
            onClick: (item) => handleEditDistrict(item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
            onClick: (item) => handleDelete(item, "district")
          }
        ]
      }
    ]
  }), [handleDelete, handleEditCountry, handleEditProvince, handleEditDistrict, t]);

  const handleCreateChild = (
    parentId: string,
    level: number
  ) => {
    handleCountryReset();
    handleProvinceReset();
    handleDistrictReset();

    const parentItem = hierarchyItems.find(hi => String(hi.id) === parentId);

    if (level === 1) {
      // Create province under the given country
      setProvCountryId(parentItem?.metadata?.countryCode as string || "");
      setCountryIsOpen(false);
      setProvinceIsOpen(true);
      setDistrictIsOpen(false);
    }
    else if (level === 2) {
      // Create district under the given province
      setDistCountryId(parentItem?.metadata?.countryCode as string || "");
      setDistProvId(parentItem?.metadata?.provinceCode as string || "");
      setCountryIsOpen(false);
      setProvinceIsOpen(false);
      setDistrictIsOpen(true);
    }
    else {
      setCountryIsOpen(false);
      setProvinceIsOpen(false);
      setDistrictIsOpen(false);
    }
  };

  return (
    <>
      <HierarchyView
        config={hierarchyConfig}
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
