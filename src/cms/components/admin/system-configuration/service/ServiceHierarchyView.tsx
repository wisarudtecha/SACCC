// /src/components/admin/system-configuration/service/ServiceHierarchyView.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIcon, FileIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { PRIORITY_LABELS, PRIORITY_CONFIG } from "@/cms/utils/constants";
import type {
  EnhancedCaseSubType,
  EnhancedCaseType,
  // TypeAnalytics
} from "@/cms/types/case";
import type {
  HierarchyItem,
  HierarchyConfig,
  // PriorityLevel
} from "@/core/types/hierarchy";
import type { Property } from "@/cms/types/unit";
import type { EnhancedSkill } from "@/core/types/user";
import type { Workflow } from "@/cms/types/workflow";
import HierarchyView from "@/core/components/admin/HierarchyView";
import Button from "@/core/components/ui/button/Button";

// const PRIORITY_LEVELS: PriorityLevel[] = [
//   { value: 0, label: "High", color: "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 border-red-200 dark:border-red-700" },
//   { value: 1, label: "High", color: "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 border-red-200 dark:border-red-700" },
//   { value: 2, label: "High", color: "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 border-red-200 dark:border-red-700" },
//   { value: 3, label: "High", color: "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 border-red-200 dark:border-red-700" },
//   { value: 4, label: "Medium", color: "bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700" },
//   { value: 5, label: "Medium", color: "bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700" },
//   { value: 6, label: "Medium", color: "bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700" },
//   { value: 7, label: "Low", color: "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 border-green-200 dark:border-green-700" },
//   { value: 8, label: "Low", color: "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 border-green-200 dark:border-green-700" },
//   { value: 9, label: "Low", color: "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 border-green-200 dark:border-green-700" },
// ];

interface ServiceHierarchyViewProps {
  // analytics?: Record<string, TypeAnalytics>;
  caseSubTypes?: EnhancedCaseSubType[];
  caseTypes?: EnhancedCaseType[];
  className?: string;
  filteredTypes?: EnhancedCaseType[];
  properties?: Property[];
  searchQuery?: string;
  showInactive?: boolean;
  skills?: EnhancedSkill[];
  workflows?: Workflow[];
  handleSTypeDelete: (id: number) => void;
  handleSTypeReset: () => void;
  handleTypeDelete: (id: number) => void;
  handleTypeReset: () => void;
  setSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
  setCaseSla: (sla: string) => void;
  setMDeviceType: (deviceType: string) => void;
  setMDeviceTypeName: (deviceTypeName: string) => void;
  setMWorkOrderType: (workOrderType: string) => void;
  setPriority: (priority: string) => void;
  setSTypeCode: (code: string) => void;
  setSTypeEn: (en: string) => void;
  setSTypeId: (id: string) => void;
  setSTypeIsOpen: (isOpen: boolean) => void;
  setSTypeTh: (th: string) => void;
  setSTypeTypeId: (typeId: string) => void;
  setTypeEn: (th: string) => void;
  setTypeId: (id: string) => void;
  setTypeIsOpen: (isOpen: boolean) => void;
  setTypeTh: (en: string) => void;
  setUnitPropLists: (propId: string[]) => void;
  setUserSkillList: (skillId: string[]) => void;
  setWfId: (wfId: string) => void;
}

const ServiceHierarchyView: React.FC<ServiceHierarchyViewProps> = ({
  // analytics,
  caseSubTypes,
  caseTypes,
  // className,
  // filteredTypes,
  // properties,
  // searchQuery,
  showInactive,
  // skills,
  // workflows,
  handleSTypeDelete,
  handleSTypeReset,
  handleTypeDelete,
  handleTypeReset,
  // setSearchQuery,
  setCaseSla,
  setMDeviceType,
  setMDeviceTypeName,
  setMWorkOrderType,
  setPriority,
  setSTypeCode,
  setSTypeEn,
  setSTypeId,
  setSTypeIsOpen,
  setSTypeTh,
  setSTypeTypeId,
  setTypeEn,
  setTypeId,
  setTypeIsOpen,
  setTypeTh,
  setUnitPropLists,
  setUserSkillList,
  setWfId
}) => {
  const { language, t } = useTranslation();

  const generatePriorityConfigs = () => {
    const langKey = language as keyof typeof PRIORITY_LABELS.high;
    return PRIORITY_CONFIG.flatMap(({ type, count, color, icon }) =>
      Array(count).fill(null).map((_, index) => ({
        color,
        icon,
        label: PRIORITY_LABELS[type][langKey],
        value: index
      }))
    );
  }
  const PRIORITY_LEVELS = generatePriorityConfigs();

  // const handleToggleActive = (
  //   item: HierarchyItem, type: string
  //   // id: string, isType: boolean
  // ) => {
  //   setIsLoading(true);
  //   setTimeout(() => {
  //     if (type === "caseType" && onCaseTypesChange) {
  //       const updated = caseTypes.map(ct => 
  //         ct.id === item.id ? { ...ct, active: !ct.active } : ct
  //       );
  //       onCaseTypesChange(updated);
  //     }
  //     else if (type === "caseSubType" && onCaseSubTypesChange) {
  //       const updated = caseSubTypes.map(cst => 
  //         cst.id === item.id ? { ...cst, active: !cst.active } : cst
  //       );
  //       onCaseSubTypesChange(updated);
  //     }
  //     setIsLoading(false);
  //   }, 500);
  //   // if (isType) {
  //   //   setCaseTypes(prev => prev.map(type => 
  //   //     type.id === id ? { ...type, active: !type.active } : type
  //   //   ));
  //   // }
  //   // else {
  //   //   // Handle sub-type toggle
  //   //   console.log("Toggle sub-type active:", id);
  //   // }
  // };

  // const handleDeleteType = async (id: string) => {
  //   if (confirm("Are you sure you want to delete this case type?")) {
  //     setIsLoading(true);
  //     setTimeout(() => {
  //       setCaseTypes(prev => prev.filter(type => type.id !== id));
  //       setIsLoading(false);
  //     }, 1000);
  //   }
  // };

  // const handleDeleteSubType = async (id: string) => {
  //   if (confirm("Are you sure you want to delete this sub-type?")) {
  //     setIsLoading(true);
  //     setTimeout(() => {
  //       console.log("Delete sub-type:", id);
  //       setIsLoading(false);
  //     }, 1000);
  //   }
  // };

  // const handleCreateSubType = (parentId: string) => {
  //   console.log("Create sub-type for parent:", parentId);
  // };

  const [deleteId, setDeleteId] = useState(0);
  const [deleteIsOpen, setDeleteIsOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteHeader, setDeleteHeader] = useState("");
  const [deleteType, setDeleteType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Convert case types and sub-types to generic hierarchy items
  const convertToHierarchyItems = useCallback((): HierarchyItem[] => {
    const items: HierarchyItem[] = [];
    
    // Add parent items (case types)
    (caseTypes || []).forEach(type => {
      const childCount = (caseSubTypes || []).filter(subType => subType.typeId === type.typeId).length;
      items.push({
        // id: type.id,
        id: type.typeId,
        parentId: null, // Explicitly set to null for root items
        name: language === "th" && type.th || type.en,
        secondaryName: language === "th" && type.en || type.th,
        icon: type.icon,
        active: type.active,
        level: 0,
        metadata: {
          typeId: type.typeId,
          color: type.color,
          createdAt: type.createdAt,
          updatedAt: type.updatedAt,
          childCount
        }
      });
    });
    
    // Add child items (case sub-types)
    (caseSubTypes || []).forEach(subType => {
      const parentType = caseTypes?.find(type => type.typeId === subType.typeId);
      if (parentType) {
        items.push({
          // id: subType.id,
          id: subType.sTypeId,
          // parentId: parentType.id,
          // parentId: parentType.typeId,
          parentId: subType.typeId,
          name: language === "th" && subType.th || subType.en,
          secondaryName: language === "th" && subType.en || subType.th,
          customName: `${subType.sTypeCode}-${language === "th" && subType.th || subType.en || ""}`,
          active: subType.active,
          priority: subType.priority,
          level: 1,
          metadata: {
            caseSla: subType.caseSla,
            mDeviceType: subType.mDeviceType,
            mDeviceTypeName: subType.mDeviceTypeName,
            mWorkOrderType: subType.mWorkOrderType,
            priority: subType.priority,
            skillRequirements: subType.userSkillList,
            sTypeCode: subType.sTypeCode,
            typeId: subType.typeId,
            unitPropLists: subType.unitPropLists,
            userSkillList: subType.userSkillList,
            wfId: subType.wfId,
          }
        });
      }
    });

    return items;
  }, [caseSubTypes, caseTypes, language]);

  const [hierarchyItems, setHierarchyItems] = useState<HierarchyItem[]>(
    convertToHierarchyItems()
  );

  // Update hierarchy items when props change
  useEffect(() => {
    setHierarchyItems(convertToHierarchyItems());
  }, [caseSubTypes, caseTypes, convertToHierarchyItems]);

  const handleDelete = useCallback(async (item: HierarchyItem, type: string) => {
    // console.log("🚀 ~ ServiceHierarchyView ~ item:", item);
    // Check if item has children
    // const hasChildren = hierarchyItems.some(
    //   hierarchyItem => hierarchyItem.parentId === item.id
    // );

    // if (hasChildren) {
    //   const childLabelMap: Record<string, string> = {
    //     "caseType": "Type",
    //     "caseSubType": "Sub-Type",
    //   };
      
    //   const childLabel = childLabelMap[type] || "child items";
      
    //   alert(
    //     `Cannot delete this ${type}. It has ${childLabel}. ` +
    //     `Please remove all ${childLabel} first before deleting this item.`
    //   );
    //   return;
    // }

    // const confirmMessage = `Are you sure you want to delete this ${type}?${item?.level !== undefined && item.level > 1 ? " This will also delete all its children." : ""}`;
    const confirmMessage = item?.customName || item.name || "";

    setIsLoading(true);

    setDeleteId(item.id as number);
    setDeleteIsOpen(true);
    // setDeleteMessage(confirmMessage);
    setDeleteType(type);
    
    if (type === "caseType") {
      // setDeleteHeader(`Type: ${item.name}`);
      setDeleteHeader(t("crud.service.confirm.type.delete.title"));
      setDeleteMessage(t("crud.service.confirm.type.delete.message").replace("_TYPE_", confirmMessage || "this type"));
    } 
    else if (type === "caseSubType") {
      // setDeleteHeader(`Sub-Type: ${item.name}`);
      setDeleteHeader(t("crud.service.confirm.sub_type.delete.title"));
      setDeleteMessage(t("crud.service.confirm.sub_type.delete.message").replace("_SUB_TYPE_", confirmMessage || "this sub-type"));
    }

    setIsLoading(false);
  }, [
    // hierarchyItems,
    t
  ]);

  const handleDeleteSelection = (id: number, type: string) => {
    if (type === "caseType") {
      handleTypeDelete(id);
    }
    else if (type === "caseSubType") {
      handleSTypeDelete(id);
    }
  }

  // Event handlers (converted to work with generic hierarchy items)
  const handleEditType = useCallback((item: HierarchyItem) => {
    // Implementation for editing case type
    // console.log("Edit type:", item);

    handleSTypeReset();
    handleTypeReset();
    setSTypeIsOpen(false as boolean);
    setTypeEn(language === "th" && item.secondaryName || item.name as string || "");
    setTypeId(item.id as string);
    setTypeIsOpen(true as boolean);
    setTypeTh(language === "th" && item.name || item.secondaryName as string || "");
  }, [language, handleSTypeReset, handleTypeReset, setSTypeIsOpen, setTypeEn, setTypeId, setTypeIsOpen, setTypeTh]);

  const handleEditSubType = useCallback((item: HierarchyItem) => {
    // Implementation for editing case sub-type
    // console.log("Edit sub-type:", item);

    handleSTypeReset();
    handleTypeReset();
    setCaseSla(item.metadata?.caseSla as string || "");
    setMDeviceType(item.metadata?.mDeviceType as string || "");
    setMDeviceTypeName(item.metadata?.mDeviceTypeName as string || "");
    setMWorkOrderType(item.metadata?.mWorkOrderType as string || "");
    setPriority(item.metadata?.priority as string || "");
    setSTypeCode(item.metadata?.sTypeCode as string || "");
    setSTypeEn(language === "th" && item.secondaryName || item.name as string || "");
    setSTypeId(item.id as string);
    setSTypeIsOpen(true as boolean);
    setSTypeTh(language === "th" && item.name || item.secondaryName as string || "");
    setSTypeTypeId(item.parentId as string || "");
    setTypeIsOpen(false as boolean);
    setUnitPropLists(item.metadata?.unitPropLists as string[] || []);
    setUserSkillList(item.metadata?.userSkillList as string[] || []);
    setWfId(item.metadata?.wfId as string || "");
  }, [
    language,
    handleSTypeReset, handleTypeReset,
    setCaseSla, setMDeviceType, setMDeviceTypeName, setMWorkOrderType, setPriority, setSTypeCode, setSTypeEn, setSTypeId, setSTypeIsOpen, setSTypeTh, setSTypeTypeId,
    setTypeIsOpen,
    setUnitPropLists, setUserSkillList, setWfId
  ]);

  // Configuration for the hierarchy view
  const hierarchyConfig: HierarchyConfig = useMemo(() => ({
    // childIcon: <FileIcon className="w-4 h-4 text-green-600 dark:text-green-300" />,
    // defaultExpanded: caseTypes?.slice(0, 1).map(ct => ct.id),
    maxLevels: 2,
    priorityLevels: PRIORITY_LEVELS,
    showInactiveLabel: true,
    displayFields: {
      primaryLabel: "name",
      secondaryLabel: "secondaryName",
      customLabel: "customName",
      metadataFields: []
      // metadataFields: ["metadata.caseSla", "metadata.skillRequirements.length"]
    },
    levels: [
      // Level 0
      {
        canHaveChildren: true,
        createChildLabel: t("crud.service.list.header.subType.create_child"),
        emptyChildrenMessage: t("crud.service.list.header.subType.no_data"),
        // icon: <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />,
        childCountLabel: {
          plural: t("crud.service.list.header.subType.plural"),
          singular: t("crud.service.list.header.subType.singular")
        },
        metadataDisplay: {
          showChildCount: true,
          showMetadata: false, // We"ll use custom formatter
          customMetadataFormatter: (_, childCount) => {
            const metadata: string[] = [];
            // Show child count with custom label
            if (childCount > 0) {
              metadata.push(`${childCount} ${childCount === 1 ? t("crud.service.list.header.subType.singular") : t("crud.service.list.header.subType.plural")}`);
            }
            return metadata;
          }
        },
        styling: {
          indentSize: 32,
          // backgroundColor: "bg-blue-100 dark:bg-blue-800"
        },
        actions: [
          {
            key: "update",
            label: t("crud.common.update"),
            variant: "warning",
            onClick: (item) => handleEditType(item)
          },
          {
            key: "delete",
            label: t("crud.common.delete"),
            variant: "outline",
            onClick: (item) => handleDelete(item, "caseType")
          }
        ]
      },
      // Level 1
      {
        canHaveChildren: false,
        icon: <FileIcon className="w-4 h-4 text-green-600 dark:text-green-300" />,
        metadataDisplay: {
          showChildCount: false,
          showMetadata: true,
          customMetadataFormatter: (item) => {
            const metadata: string[] = [];
            // Show SLA
            if (item.metadata?.caseSla) {
              metadata.push(`SLA: ${item.metadata.caseSla}${t("crud.service.unit.minutes")}`);
            }
            // Show skill requirements
            if (Array.isArray(item.metadata?.skillRequirements) && item.metadata.skillRequirements.length) {
              const skillCount = item.metadata.skillRequirements.length;
              // metadata.push(`${skillCount} ${skillCount === 1 ? "skill" : "skills"} required`);
              metadata.push(`${skillCount} ${skillCount === 1
                ? t("crud.service.list.header.subType.skill_required.singular")
                : t("crud.service.list.header.subType.skill_required.plural")}`);
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
            onClick: (item) => handleEditSubType(item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
            onClick: (item) => handleDelete(item, "caseSubType")
          }
        ]
      }
    ]
    // parentActions: [
    //   {
    //     label: "Edit",
    //     variant: "warning",
    //     onClick: (item) => handleEditType(item)
    //   },
    //   {
    //     label: "Deactivate",
    //     variant: "error",
    //     onClick: (item) => handleToggleActive(item.id, true),
    //     showWhen: (item) => item.active
    //   },
    //   {
    //     label: "Activate",
    //     variant: "success",
    //     onClick: (item) => handleToggleActive(item.id, true),
    //     showWhen: (item) => !item.active
    //   },
    //   {
    //     label: "Delete",
    //     variant: "outline",
    //     onClick: (item) => handleDeleteType(item.id)
    //   }
    // ],
    // childActions: [
    //   {
    //     label: "Edit",
    //     variant: "warning",
    //     onClick: (item) => handleEditSubType(item)
    //   },
    //   {
    //     label: "Deactivate",
    //     variant: "error",
    //     onClick: (item) => handleToggleActive(item.id, false),
    //     showWhen: (item) => item.active
    //   },
    //   {
    //     label: "Activate",
    //     variant: "success",
    //     onClick: (item) => handleToggleActive(item.id, false),
    //     showWhen: (item) => !item.active
    //   },
    //   {
    //     label: "Delete",
    //     variant: "outline",
    //     onClick: (item) => handleDeleteSubType(item.id)
    //   }
    // ]
  }), [
    // caseTypes,
    PRIORITY_LEVELS,
    handleDelete,
    handleEditSubType,
    handleEditType,
    // handleToggleActive,
    t
  ]);

  const handleCreateChild = (
    _parentId: string,
    level: number
  ) => {
    // console.log(`Create child at level ${level} for parent ${parentId}`);

    handleSTypeReset();
    handleTypeReset();
    
    if (level === 1) {
      // Create sub-type
      // console.log("Create new sub-type for type:", parentId);

      setSTypeIsOpen(true);
      setTypeIsOpen(false);
    }
    else {
      setSTypeIsOpen(false);
      setTypeIsOpen(true);
    }
  };

  return (
    <>
      <HierarchyView
        // analytics={analytics}
        config={hierarchyConfig}
        // defaultExpanded={["EMERGENCY"]}
        isLoading={isLoading}
        items={hierarchyItems}
        showInactive={showInactive}
        // onCreateChild={(parentId) => handleCreateChild(parentId, 0)}
        onCreateChild={(parentId, level) => handleCreateChild(parentId, level)}
        // onCreateChild={handleCreateSubType}
        onLoadingChange={setIsLoading}
        // onItemsChange={setHierarchyItems}
      />

      <Modal isOpen={deleteIsOpen} onClose={() => setDeleteIsOpen(false)} className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto cursor-default">
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
            <Button onClick={() => setDeleteIsOpen(false)} variant="outline">{t("crud.service.confirm.button.cancel")}</Button>
            <Button onClick={() => {
              handleDeleteSelection(deleteId, deleteType);
              setDeleteIsOpen(false);
            }} variant="error">{!isLoading && t("crud.service.confirm.button.confirm") || t("crud.service.confirm.button.deleting")}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ServiceHierarchyView;
