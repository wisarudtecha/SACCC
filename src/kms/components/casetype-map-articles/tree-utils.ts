import { BreadcrumbNode, CheckboxState, TreeNode } from './TreeMultiSelect.types';
// import { useTranslation } from "@/core/hooks/useTranslation";
/**
 * Check if a node is a leaf (has no children or empty children array)
 */
// const { t } = useTranslation();
export function isLeafNode(node: TreeNode): boolean {
  return !node.children || node.children.length === 0;
}

/**
 * Recursively find all leaf node IDs under a given node
 */
export function getLeafIds(node: TreeNode): string[] {
  if (isLeafNode(node)) {
    return [node.id];
  }
  return (node.children || []).flatMap(getLeafIds);
}

/**
 * Get all descendant node IDs (including intermediate and leaf nodes)
 */
export function getDescendantIds(node: TreeNode): string[] {

  // console.log('t',t)



  const ids: string[] = [];
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      ids.push(child.id);
      ids.push(...getDescendantIds(child));
    }
  }
  return ids;
}

/**
 * Find a node by its ID in the tree
 */
export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find the parent node of a given node ID
 */
export function findParent(nodes: TreeNode[], targetId: string, parent: TreeNode | null = null): TreeNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return parent;
    }
    if (node.children && node.children.length > 0) {
      const found = findParent(node.children, targetId, node);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get breadcrumb path for a node by ID (e.g., "เสื้อผ้า > เสื้อ > เสื้อยืด")
 */
export function getNodeBreadcrumbPath(nodes: TreeNode[], targetId: string, currentPath: string[] = []): string[] | null {
  for (const node of nodes) {
    const newPath = [...currentPath, node.label];
    if (node.id === targetId) {
      return newPath;
    }
    if (node.children && node.children.length > 0) {
      const found = getNodeBreadcrumbPath(node.children, targetId, newPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get map of leaf ID to its full breadcrumb path info
 */
export function getAllLeafBreadcrumbs(nodes: TreeNode[]): Map<string, BreadcrumbNode> {
  const map = new Map<string, BreadcrumbNode>();

  function traverse(nodeList: TreeNode[], path: string[]) {

    for (const node of nodeList) {
      const currentPath = [...(path ?? []), node.label];
      if (isLeafNode(node)) {
        map.set(node.id, {
          id: node.id,
          label: node.label,
          path: currentPath.join(' > '),
        });
      } else if (node.children) {
        traverse(node.children, currentPath);
      }
    }


  }

  traverse(nodes, []);
  return map;
}

/**
 * Determine the checkbox state ('checked' | 'unchecked' | 'indeterminate') for a node
 * based on the currently selected leaf IDs.
 */
export function getNodeCheckboxState(node: TreeNode, selectedLeafIds: Set<string>): CheckboxState {
  if (isLeafNode(node)) {
    return selectedLeafIds.has(node.id) ? 'checked' : 'unchecked';
  }

  const allLeaves = getLeafIds(node);
  if (allLeaves.length === 0) return 'unchecked';

  let selectedCount = 0;
  for (const leafId of allLeaves) {
    if (selectedLeafIds.has(leafId)) {
      selectedCount++;
    }
  }

  if (selectedCount === 0) {
    return 'unchecked';
  }
  if (selectedCount === allLeaves.length) {
    return 'checked';
  }
  return 'indeterminate';
}

/**
 * Toggle a node selection.
 * - If checked or indeterminate -> uncheck all leaf descendants
 * - If unchecked -> check all leaf descendants
 * Returns new Set of selected leaf IDs
 */
export function toggleNodeSelection(node: TreeNode, currentSelectedLeafIds: Set<string>): Set<string> {
  const next = new Set(currentSelectedLeafIds);
  const leaves = getLeafIds(node);
  const currentState = getNodeCheckboxState(node, currentSelectedLeafIds);

  if (currentState === 'checked' || currentState === 'indeterminate') {
    // Unselect all leaves
    for (const id of leaves) {
      next.delete(id);
    }
  } else {
    // Select all leaves
    for (const id of leaves) {
      next.add(id);
    }
  }

  return next;
}

/**
 * Filter tree by keyword. Keeps any node whose label matches or that has a matching descendant.
 * Also returns a set of parent node IDs that should be expanded to show the matches.
 */
export function filterTree(nodes: TreeNode[], keyword: string): { filtered: TreeNode[]; expandedNodeIds: Set<string> } {
  const trimmed = keyword.trim().toLowerCase();
  if (!trimmed) {
    return { filtered: nodes, expandedNodeIds: new Set() };
  }

  const expandedNodeIds = new Set<string>();

  function filterNode(node: TreeNode): TreeNode | null {
    const isSelfMatch = node.label.toLowerCase().includes(trimmed);

    if (!node.children || node.children.length === 0) {
      return isSelfMatch ? { ...node } : null;
    }

    const filteredChildren: TreeNode[] = [];
    for (const child of node.children) {
      const match = filterNode(child);
      if (match) {
        filteredChildren.push(match);
      }
    }

    if (isSelfMatch || filteredChildren.length > 0) {
      expandedNodeIds.add(node.id);
      return {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : (isSelfMatch ? node.children : undefined),
      };
    }

    return null;
  }

  const filtered: TreeNode[] = [];
  for (const node of nodes) {
    const result = filterNode(node);
    if (result) {
      filtered.push(result);
    }
  }

  return { filtered, expandedNodeIds };
}

/**
 * Collect all parent IDs in the tree
 */
export function getAllParentIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  function traverse(list: TreeNode[]) {

    for (const item of list) {
      if (item.children && item.children.length > 0) {
        ids.push(item.id);
        traverse(item.children);
      }
    }

  }
  traverse(nodes);
  return ids;
}
