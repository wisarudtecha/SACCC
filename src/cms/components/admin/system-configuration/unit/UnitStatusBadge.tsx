// src/components/admin/system-configuration/unit/UnitStatusBadge.tsx
import React from "react";
import { AlertHexaIcon, CheckCircleIcon, CloseIcon, TimeIcon } from "@/core/icons";

const UnitStatusBadgeContent: React.FC<{
  status: string;
  className?: string
}> = ({
  status,
  className = ""
}) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircleIcon };
      case "busy":
        return { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", icon: TimeIcon };
      case "maintenance":
        return { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: AlertHexaIcon };
      case "offline":
        return { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", icon: CloseIcon };
      default:
        return { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", icon: CloseIcon };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium capitalize ${config.color} ${className}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
};

export default UnitStatusBadgeContent;
