export interface CategoryNode {
  key: string;
  title: string;
  nameTh: string;
  nameEn: string | null;
  children?: CategoryNode[];
  parentKey?: string;
  articleCount: number;
}

export type CategoryAction =
  | { type: "add"; parentKey?: string; nameTh: string; nameEn: string | null }
  | { type: "rename"; key: string; nameTh: string; nameEn: string | null }
  | { type: "delete"; key: string }
  | { type: "move"; key: string; newParentKey?: string; newIndex: number };

export interface CategoryTreeResult {
  nodes: CategoryNode[];
}
