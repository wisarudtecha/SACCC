// /src/types/hierarchy.ts
export interface HierarchyAction {
  key?: string;
  label: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant: "primary" | "secondary" | "success" | "error" | "warning" | "info" | "light" | "dark" | "outline" | "ghost";
  onClick: (item: HierarchyItem) => void;
  showWhen?: (item: HierarchyItem) => boolean;
}

export interface HierarchyAnalytics {
  slaCompliance?: number;
  usageCount?: number;
  [key: string]: unknown;
}

export interface LevelConfig {
  actions: HierarchyAction[];
  canHaveChildren?: boolean;
  childCountLabel?: {
    plural: string;
    singular: string;
  };
  collapseIcon?: React.ReactNode;
  createChildLabel?: string;
  emptyChildrenMessage?: string;
  expandIcon?: React.ReactNode;
  icon?: React.ReactNode;
  metadataDisplay?: {
    showChildCount?: boolean;
    showMetadata?: boolean;
    customMetadataFormatter?: (item: HierarchyItem, childCount: number) => string[];
  };
  styling?: {
    backgroundColor?: string;
    borderColor?: string;
    indentSize?: number;
  };
}

export interface PriorityLevel {
  color: string;
  label: string;
  value: string | number;
}

export interface HierarchyConfig {
  // childActions?: HierarchyAction[];
  // childIcon?: React.ReactNode;
  // collapseIcon?: React.ReactNode;
  defaultExpanded?: string[];
  displayFields: {
    metadataFields?: string[];
    primaryLabel: string;
    secondaryLabel?: string;
    customLabel?: string;
  };
  // expandIcon?: React.ReactNode;
  levels: LevelConfig[]; // Configuration for each level [0, 1, 2, ...]
  maxLevels?: number;
  // parentActions?: HierarchyAction[];
  // parentIcon?: React.ReactNode;
  priorityLevels?: PriorityLevel[];
  showInactiveLabel?: boolean;
}

export interface HierarchyItem {
  id: string | number;
  active: boolean;
  icon?: string | React.ReactNode;
  level?: number; // 0 = root, 1 = first child, 2 = second child, etc.
  metadata?: Record<string, unknown>;
  name: string;
  secondaryName?: string;
  customName?: string;
  parentId?: string | number | null; // null for root items
  priority?: string | number;
  createdAt?: string;
  updatedAt?: string;
}
