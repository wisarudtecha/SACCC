// /src/components/widgets/WidgetActions.tsx
// Updated: [08-07-2025] v0.1.2
import React, { useState, useEffect, useRef }
from "react";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import {
  MoreDotIcon,
} from "@/core/icons";

export const WidgetActions: React.FC<{
  onRemove: () => void;
  onViewMore: () => void;
}> = ({
  onRemove,
  onViewMore
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block">
      <button className="dropdown-toggle" onClick={() => setShowDropdown(!showDropdown)}>
        <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
      </button>
      <Dropdown
        isOpen={showDropdown}
        onClose={() => setShowDropdown(false)}
        className="w-40 p-2"
      >
        <DropdownItem
          onItemClick={() => {
            onViewMore();
            setShowDropdown(false);
          }}
          className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          View More
        </DropdownItem>
        <DropdownItem
          onItemClick={() => {
            onRemove();
            setShowDropdown(false);
          }}
          className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Delete
        </DropdownItem>
      </Dropdown>
    </div>
  );
};
