export interface TreeNode {
  id: string;
  label: string;
  label_th: string;
  label_en: string;
  children?: TreeNode[];
}

export interface TreeMultiSelectProps {
  /** Tree data structure */
  data?: TreeNode[];

  /** Controlled selected IDs */
  value?: string[];

  /** Default selected IDs (uncontrolled) */
  defaultValue?: string[];

  /** Callback when selection changes - returns array of selected leaf node IDs */
  onChange?: (selectedIds: string[]) => void;

  /** Placeholder text */
  //placeholder?: string;

  /** Enable search/filter functionality */
  searchable?: boolean;

  /** Disable the entire component */
  disabled?: boolean;

  /** Additional CSS class for the wrapper */
  className?: string;
}

export type CheckboxState = 'checked' | 'unchecked' | 'indeterminate';

export interface BreadcrumbNode {
  id: string;
  label: string;
  path: string; // e.g. "เสื้อผ้า > เสื้อ > เสื้อยืด"
}