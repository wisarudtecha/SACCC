// /src/components/crud/DisplayModeToggle.tsx
import React, { JSX } from "react";
import { GridIcon, ListIcon, TableIcon, BoxCubeIcon } from "@/core/icons";
import Button from "@/core/components/ui/button/Button";

interface DisplayModeToggleProps {
  mode: "card" | "table" | "matrix" | "hierarchy";
  list: ("card" | "table" | "matrix" | "hierarchy")[];
  onChange: (mode: "card" | "table" | "matrix" | "hierarchy") => void;
}

export const DisplayModeToggle: React.FC<DisplayModeToggleProps> = ({
  mode,
  list,
  onChange
}) => {
  const Icons = {
    card: GridIcon,
    table: ListIcon,
    matrix: TableIcon,
    hierarchy: BoxCubeIcon
  };

  const button: JSX.Element[] = [];
  list.map((item, index) => {
    const Icon = Icons[item] as React.FC<{ className: string }>;
    button.push(
      <Button
        key={`displayModeToggle-${index}`}
        onClick={() => onChange(`${item}`)}
        className={`h-11 ${index > 0 ? "rounded-l-none" : ""} ${index < list.length - 1 ? "rounded-r-none" : ""}`}
        variant={mode === item ? "primary" : "outline"}
      >
        <Icon className="w-4 h-4" />
      </Button>
    );
  });

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg overflow-hidden">
        {button}
      </div>
    </div>
  );
};
