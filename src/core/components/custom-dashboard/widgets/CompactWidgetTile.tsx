// src/core/components/custom-dashboard/widgets/CompactWidgetTile.tsx
import React from "react";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/core/components/ui/animation/AnimatedNumber";

interface CompactWidgetTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export const CompactWidgetTile: React.FC<CompactWidgetTileProps> = ({ icon: Icon, label, value }) => (
  <div className="flex h-full items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
    <Icon className="shrink-0 text-blue-500 dark:text-blue-400" size={28} />
    <div className="min-w-0">
      <div className="truncate text-xs text-gray-500 dark:text-gray-400">{label}</div>
      {typeof value === "number" ? (
        <AnimatedNumber value={value} duration={1} className="text-2xl font-bold text-gray-900 dark:text-white" />
      ) : (
        <div className="truncate text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      )}
    </div>
  </div>
);

export default CompactWidgetTile;
