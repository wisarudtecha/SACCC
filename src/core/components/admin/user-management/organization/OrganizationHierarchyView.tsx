// /src/components/admin/user-management/organization/OrganizationHierarchyView.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIcon, FileIcon } from "@/core/icons";
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type {
  Department,
  Command,
  Station,
  // Organization
} from "@/core/types/organization";
import type { HierarchyItem, HierarchyConfig } from "@/core/types/hierarchy";
import HierarchyView from "@/core/components/admin/HierarchyView";
import Button from "@/core/components/ui/button/Button";

interface OrganizationHierarchyViewProps {
  departments: Department[];
  commands: Command[];
  stations: Station[];
  // organizations: Organization[];
  showInactive: boolean;
  handleDepartmentDelete: (id: number) => void;
  handleDepartmentReset: () => void;
  handleCommandDelete: (id: number) => void;
  handleCommandReset: () => void;
  handleStationDelete: (id: number) => void;
  handleStationReset: () => void;
  setDeptId: (id: string) => void;
  setDeptIsOpen: (isOpen: boolean) => void;
  setDeptTh: (th: string) => void;
  setDeptEn: (en: string) => void;
  setCommId: (id: string) => void;
  setCommIsOpen: (isOpen: boolean) => void;
  setCommDeptId: (deptId: string) => void;
  setCommandTh: (th: string) => void;
  setCommandEn: (en: string) => void;
  setStnId: (id: string) => void;
  setStnIsOpen: (isOpen: boolean) => void;
  setStnDeptId: (deptId: string) => void;
  setStnCommId: (commId: string) => void;
  setStnTh: (th: string) => void;
  setStnEn: (en: string) => void;
  // onDepartmentsChange?: (departments: Department[]) => void;
  // onCommandsChange?: (commands: Command[]) => void;
  // onStationsChange?: (stations: Station[]) => void;
  // onOrganizationsChange?: (organizations: Organization[]) => void;
}

const OrganizationHierarchyView: React.FC<OrganizationHierarchyViewProps> = ({
  departments,
  commands,
  stations,
  // organizations,
  showInactive,
  handleDepartmentDelete,
  handleDepartmentReset,
  handleCommandDelete,
  handleCommandReset,
  handleStationDelete,
  handleStationReset,
  setDeptId,
  setDeptIsOpen,
  setDeptTh,
  setDeptEn,
  setCommId,
  setCommIsOpen,
  setCommDeptId,
  setCommandTh,
  setCommandEn,
  setStnId,
  setStnIsOpen,
  setStnDeptId,
  setStnCommId,
  setStnTh,
  setStnEn,
  // onDepartmentsChange,
  // onCommandsChange,
  // onStationsChange,
  // onOrganizationsChange
}) => {
  const { language, t } = useTranslation();

  const [deleteId, setDeleteId] = useState(0);
  const [deleteIsOpen, setDeleteIsOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteHeader, setDeleteHeader] = useState("");
  const [deleteType, setDeleteType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Convert department, commands and stations to generic hierarchy items
  const convertToHierarchyItems = useCallback((): HierarchyItem[] => {
    const items: HierarchyItem[] = [];
    
    // Add parent items (departments)
    (departments || []).forEach(dept => {
      items.push({
        // id: dept.id,
        id: dept.deptId,
        parentId: null, // Explicitly set to null for root items
        name: language === "th" && dept.th || dept.en,
        secondaryName: language === "th" && dept.en || dept.th,
        // icon: dept.icon,
        active: dept.active,
        level: 0,
        metadata: {
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt
        }
      });
    });
    
    // Add child items for department (commands)
    (commands || []).forEach(cmd => {
      const parentType = departments?.find(dept => dept.deptId === cmd.deptId);
      if (parentType) {
        items.push({
          // id: cmd.id,
          id: cmd.commId,
          // parentId: parentType.id,
          // parentId: parentType.deptId,
          parentId: cmd.deptId,
          name: language === "th" && cmd.th || cmd.en,
          secondaryName: language === "th" && cmd.en || cmd.th,
          active: cmd.active,
          // priority: cmd.priority,
          level: 1,
          metadata: {
            deptId: cmd.deptId
          }
        });
      }
    });

    // Add child items for command (stations)
    (stations || []).forEach(stn => {
      const parentType = commands?.find(cmd => cmd.commId === stn.commId);
      if (parentType) {
        items.push({
          // id: stn.id,
          id: stn.stnId,
          // parentId: parentType.id,
          // parentId: parentType.commId,
          parentId: stn.commId,
          name: language === "th" && stn.th || stn.en,
          secondaryName: language === "th" && stn.en || stn.th,
          active: stn.active,
          // priority: stn.priority,
          level: 2,
          metadata: {
            deptId: stn.deptId,
            commId: stn.commId
          }
        });
      }
    });
    
    return items;
  }, [departments, commands, language, stations]);

  const [hierarchyItems, setHierarchyItems] = useState<HierarchyItem[]>(
    convertToHierarchyItems()
  );

  // Update hierarchy items when props change
  useEffect(() => {
    setHierarchyItems(convertToHierarchyItems());
  }, [departments, commands, stations, convertToHierarchyItems]);

  const handleDelete = useCallback(async (item: HierarchyItem, type: string) => {
    // Check if item has children
    // const hasChildren = hierarchyItems.some(
    //   hierarchyItem => hierarchyItem.parentId === item.id
    // );

    // if (hasChildren) {
    //   const childLabelMap: Record<string, string> = {
    //     "department": "commands",
    //     "command": "stations",
    //   };
      
    //   const childLabel = childLabelMap[type] || "child items";
      
    //   alert(
    //     `Cannot delete this ${type}. It has ${childLabel}. ` +
    //     `Please remove all ${childLabel} first before deleting this item.`
    //   );
    //   return;
    // }

    // const confirmMessage = `Are you sure you want to delete this ${type}?${item?.level !== undefined && item.level > 2 ? " This will also delete all its children." : ""}`;
    const confirmMessage = item?.customName || item.name || "";

    // if (confirm(confirmMessage)) {
      setIsLoading(true);

      setDeleteId(item.id as number);
      setDeleteIsOpen(true);
      setDeleteMessage(confirmMessage);
      setDeleteType(type);
      
      // setTimeout(() => {
        if (type === "department"
          // && onDepartmentsChange
        ) {
          // handleDepartmentDelete(item.id as number);

          // setDeleteHeader(`Department: ${item.name}`);
          setDeleteHeader(t("crud.organization.confirm.dept.delete.title"));
          setDeleteMessage(t("crud.organization.confirm.dept.delete.message").replace("_DEPT_", confirmMessage || "this department"));

          // Also remove associated commands and stations
          // const updatedDepartments = departments.filter(dept => dept.id !== item.id);
          // const remainingCommands = commands.filter(cmd => cmd.deptId !== item.id);
          // const remainingStations = stations.filter(stn => {
          //   const command = commands.find(cmd => cmd.id === stn.commId);
          //   return command?.deptId !== item.id;
          // });
          
          // onDepartmentsChange(updatedDepartments);
          // if (onCommandsChange) {
          //   onCommandsChange(remainingCommands);
          // }
          // if (onStationsChange) {
          //   onStationsChange(remainingStations);
          // }
        } 
        else if (type === "command"
          // && onCommandsChange
        ) {
          // handleCommandDelete(item.id as number);

          // setDeleteHeader(`Command: ${item.name}`);
          setDeleteHeader(t("crud.organization.confirm.comm.delete.title"));
          setDeleteMessage(t("crud.organization.confirm.comm.delete.message").replace("_COMM_", confirmMessage || "this command"));

          // Also remove associated stations
          // const updatedCommands = commands.filter(cmd => cmd.id !== item.id);
          // const remainingStations = stations.filter(stn => stn.id !== item.id);
          
          // onCommandsChange(updatedCommands);
          // if (onStationsChange) {
          //   onStationsChange(remainingStations);
          // }
        }
        else if (type === "station"
          // && onStationsChange
        ) {
          // handleStationDelete(item.id as number);

          // setDeleteHeader(`Station: ${item.name}`);
          setDeleteHeader(t("crud.organization.confirm.stn.delete.title"));
          setDeleteMessage(t("crud.organization.confirm.stn.delete.message").replace("_STN_", confirmMessage || "this station"));

          // const updatedStations = stations.filter(stn => stn.id !== item.id);
          // onStationsChange(updatedStations);
        }
        setIsLoading(false);
      // }, 1000);
    // }
  }, [
    // hierarchyItems,
    // handleDepartmentDelete,
    // handleCommandDelete,
    // handleStationDelete,
    t
  ]);

  const handleDeleteSelection = (id: number, type: string) => {
    if (type === "department") {
      handleDepartmentDelete(id);
    }
    else if (type === "command") {
      handleCommandDelete(id);
    }
    else if (type === "station") {
      handleStationDelete(id);
    }
  }

  // Event handlers (converted to work with generic hierarchy items)
  const handleEditDepartment = useCallback((item: HierarchyItem) => {
    // Implementation for editing department
    // console.log("Edit department:", item);

    handleCommandReset();
    handleStationReset();
    setDeptId(item.id as string);
    setDeptTh(language === "th" && item.name || item.secondaryName || "");
    setDeptEn(language === "th" && item.secondaryName || item.name || "");
    setDeptIsOpen(true);
    setCommIsOpen(false);
    setStnIsOpen(false);
  }, [language, handleCommandReset, handleStationReset, setDeptId, setDeptTh, setDeptEn, setDeptIsOpen, setCommIsOpen, setStnIsOpen]);

  const handleEditCommand = useCallback((item: HierarchyItem) => {
    // Implementation for editing command
    // console.log("Edit command:", item);

    handleDepartmentReset();
    handleStationReset();
    setCommId(item.id as string);
    setCommandTh(language === "th" && item.name || item.secondaryName || "");
    setCommandEn(language === "th" && item.secondaryName || item.name || "");
    setCommDeptId(item?.metadata?.deptId as string || "");
    setDeptIsOpen(false);
    setCommIsOpen(true);
    setStnIsOpen(false);
  }, [language, handleDepartmentReset, handleStationReset, setCommandEn, setCommandTh, setCommDeptId, setCommId, setCommIsOpen, setDeptIsOpen, setStnIsOpen]);

  const handleEditStation = useCallback((item: HierarchyItem) => {
    // Implementation for editing station
    // console.log("Edit station:", item);

    handleDepartmentReset();
    handleCommandReset();
    setStnId(item.id as string);
    setStnTh(language === "th" && item.name || item.secondaryName || "");
    setStnEn(language === "th" && item.secondaryName || item.name || "");
    setStnCommId(item?.metadata?.commId as string || "");
    setStnDeptId(item?.metadata?.deptId as string || "");
    setDeptIsOpen(false);
    setCommIsOpen(false);
    setStnIsOpen(true);
  }, [language, handleDepartmentReset, handleCommandReset, setStnId, setStnTh, setStnEn, setStnCommId, setStnDeptId, setDeptIsOpen, setCommIsOpen, setStnIsOpen]);

  // Configuration for the hierarchy view
  const hierarchyConfig: HierarchyConfig = useMemo(() => ({
    // childIcon: <FileIcon className="w-4 h-4 text-green-600 dark:text-green-300" />,
    // defaultExpanded: departments?.slice(0, 1).map(dept => dept.id),
    maxLevels: 3,
    showInactiveLabel: true,
    displayFields: {
      primaryLabel: "name",
      secondaryLabel: "secondaryName",
      metadataFields: []
    },
    levels: [
      // Level 0
      {
        canHaveChildren: true,
        createChildLabel: t("crud.organization.list.header.comm.create_child"),
        emptyChildrenMessage: t("crud.organization.list.header.comm.no_data"),
        // icon: <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />,
        childCountLabel: {
          plural: t("crud.organization.list.header.comm.plural"),
          singular: t("crud.organization.list.header.comm.singular")
        },
        metadataDisplay: {
          showChildCount: true,
          showMetadata: false, // We"ll use custom formatter
          customMetadataFormatter: (_, childCount) => {
            const metadata: string[] = [];
            // Show child count with custom label
            if (childCount > 0) {
              metadata.push(`${childCount} ${childCount === 1 ? t("crud.organization.list.header.comm.singular") : t("crud.organization.list.header.comm.plural")}`);
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
            onClick: (item) => handleEditDepartment(item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
            onClick: (item) => handleDelete(item, "department")
          }
        ]
      },
      // Level 1
      {
        canHaveChildren: true,
        createChildLabel: t("crud.organization.list.header.stn.create_child"),
        emptyChildrenMessage: t("crud.organization.list.header.stn.no_data"),
        childCountLabel: {
          plural: t("crud.organization.list.header.stn.plural"),
          singular: t("crud.organization.list.header.stn.singular"),
        },
        metadataDisplay: {
          showChildCount: true,
          showMetadata: true,
          customMetadataFormatter: (_, childCount) => {
            const metadata: string[] = [];
            // Show child count with custom label
            if (childCount > 0) {
              metadata.push(`${childCount} ${childCount === 1 ? t("crud.organization.list.header.stn.singular") : t("crud.organization.list.header.stn.plural")}`);
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
            onClick: (item) => handleEditCommand(item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
            onClick: (item) => handleDelete(item, "command")
          }
        ]
      },
      // Level 2
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
            onClick: (item) => handleEditStation(item)
          },
          {
            label: t("crud.common.delete"),
            variant: "outline",
            onClick: (item) => handleDelete(item, "station")
          }
        ]
      }
    ]
  }), [handleDelete, handleEditCommand, handleEditDepartment, handleEditStation, t]);

  const handleCreateChild = (
    _parentId: string,
    level: number
  ) => {
    // console.log(`Create child at level ${level} for parent ${parentId}`);

    handleDepartmentReset();
    handleCommandReset();
    handleStationReset();
    
    if (level === 1) {
      // Create command
      // console.log("Create new command for department:", parentId);

      setDeptIsOpen(false);
      setCommIsOpen(true);
      setStnIsOpen(false);
    }
    else if (level === 2) {
      // Create station
      // console.log("Create new station for command:", parentId);

      setDeptIsOpen(false);
      setCommIsOpen(false);
      setStnIsOpen(true);
    }
    else {
      setDeptIsOpen(false);
      setCommIsOpen(false);
      setStnIsOpen(false);
    }
  };

  return (
    <>
      <HierarchyView
        config={hierarchyConfig}
        isLoading={isLoading}
        items={hierarchyItems}
        showInactive={showInactive}
        // onCreateChild={(parentId) => handleCreateChild(parentId, 0)}
        onCreateChild={(parentId, level) => handleCreateChild(parentId, level)}
        onLoadingChange={setIsLoading}
      />

      <Modal isOpen={deleteIsOpen} onClose={() => setDeleteIsOpen(false)} className="max-w-4xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-default">
            Delete {deleteHeader}
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
            <Button onClick={() => setDeleteIsOpen(false)} variant="outline">{t("crud.organization.confirm.button.cancel")}</Button>
            <Button onClick={() => {
              handleDeleteSelection(deleteId, deleteType);
              setDeleteIsOpen(false);
            }} variant="error">{!isLoading && t("crud.organization.confirm.button.confirm") || t("crud.organization.confirm.button.deleting")}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OrganizationHierarchyView;
