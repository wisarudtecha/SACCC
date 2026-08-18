import {
  CategoryAction,
  CategoryNode,
  CategoryTreeResult,
} from "@/kms/articles/dtos/category.dto";
import { General } from "@/kms/constant";
import { graphqlRequest } from "@/kms/common/graphql.service";
import {
  isRecord,
  pickFirst,
  toNumber,
  toStringValue,
  toNullableString,
  extractArrayPayload,
  wait,
} from "@/kms/common/common.transform.service";
import type { KBCategoryGraphQLData } from "@/kms/articles/dtos/category-graphql.dto";

// ─── helpers ──────────────────────────────────────────────────────────────────

const uid = () => `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const escapeGQL = (str: string): string =>
  str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");


const cloneTree = (nodes: CategoryNode[]): CategoryNode[] =>
  nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined,
  }));


// ─── tree helpers ─────────────────────────────────────────────────────────────

const findNode = (nodes: CategoryNode[], key: string): CategoryNode | null => {
  for (const n of nodes) {
    if (n.key === key) return n;
    if (n.children) {
      const found = findNode(n.children, key);
      if (found) return found;
    }
  }
  return null;
};

const removeNode = (nodes: CategoryNode[], key: string): boolean => {
  const idx = nodes.findIndex((n) => n.key === key);
  if (idx !== -1) {
    nodes.splice(idx, 1);
    return true;
  }
  for (const n of nodes) {
    if (n.children && removeNode(n.children, key)) return true;
  }
  return false;
};

const insertNode = (
  nodes: CategoryNode[],
  parentKey: string | undefined,
  node: CategoryNode,
  index: number,
): boolean => {
  if (!parentKey) {
    nodes.splice(index, 0, node);
    return true;
  }
  for (const n of nodes) {
    if (n.key === parentKey) {
      if (!n.children) n.children = [];
      n.children.splice(index, 0, node);
      return true;
    }
    if (n.children && insertNode(n.children, parentKey, node, index))
      return true;
  }
  return false;
};

export const buildPath = (
  nodes: CategoryNode[],
  key: string,
  path: string[] = [],
  lang = "en",
): string | null => {
  for (const n of nodes) {
    const label =
      lang === "th"
        ? n.nameTh || n.nameEn || ""
        : n.nameEn || n.nameTh || "";
    if (n.key === key) return [...path, label].join(" > ");
    if (n.children) {
      const found = buildPath(n.children, key, [...path, label], lang);
      if (found) return found;
    }
  }
  return null;
};

// ─── GraphQL helpers ──────────────────────────────────────────────────────────

const buildAddCategoryQuery = (
  nameTh: string,
  nameEn: string | null,
  parentId: number | null,
  seq: number,
): string => {
  const nameEnStr = nameEn !== null ? `"${escapeGQL(nameEn)}"` : "null";
  const parentIdStr = parentId !== null ? String(parentId) : "null";
  return `query { KBCategory { AddCategory(input: { name_th: "${escapeGQL(nameTh)}", name_en: ${nameEnStr}, parentId: ${parentIdStr}, seq: ${seq} }) { statusCode success message data } } }`;
};

const createCategoryViaApi = async (
  nameTh: string,
  nameEn: string | null,
  parentKey: string | undefined,
  seq: number,
): Promise<CategoryNode> => {
  const parentId = parentKey ? Number(parentKey) : null;
  const res = await graphqlRequest<KBCategoryGraphQLData>({
    query: buildAddCategoryQuery(nameTh, nameEn, parentId, seq),
  });
  const addResponse = res.data?.KBCategory?.AddCategory;
  if (!isRecord(addResponse) || !addResponse.success) {
    console.error("[AddCategory] failed:", addResponse);
    throw new Error("Failed to add category");
  }
  const raw = isRecord(addResponse.data) ? addResponse.data : {};
  const realNameTh = toStringValue(raw.name_th, nameTh);
  const realNameEn = toNullableString(raw.name_en ?? nameEn);
  return {
    key: toStringValue(pickFirst(raw.categoryId, raw.id), uid()),
    title: realNameTh || realNameEn || "",
    nameTh: realNameTh,
    nameEn: realNameEn,
    parentKey,
    articleCount: 0,
    children: [],
  };
};

const buildUpdateCategoryQuery = (
  id: number,
  nameTh: string,
  nameEn: string | null,
  parentId: number | null,
  seq: number,
): string => {
  const nameEnStr = nameEn !== null ? `"${escapeGQL(nameEn)}"` : "null";
  const parentIdStr = parentId !== null ? String(parentId) : "null";
  return `query { KBCategory { UpdateCategory(input: { id: ${id}, name_th: "${escapeGQL(nameTh)}", name_en: ${nameEnStr}, parentId: ${parentIdStr}, seq: ${seq} }) { statusCode success message data } } }`;
};

const updateCategoryViaApi = async (
  key: string,
  nameTh: string,
  nameEn: string | null,
  parentKey: string | undefined,
  seq: number,
): Promise<void> => {
  const id = Number(key);
  const parentId = parentKey ? Number(parentKey) : null;
  const res = await graphqlRequest<KBCategoryGraphQLData>({
    query: buildUpdateCategoryQuery(id, nameTh, nameEn, parentId, seq),
  });
  const updateResponse = res.data?.KBCategory?.UpdateCategory;
  if (!isRecord(updateResponse) || !updateResponse.success) {
    console.error("[UpdateCategory] failed:", updateResponse);
    throw new Error("Failed to update category");
  }
};

const collectAllKeys = (node: CategoryNode): string[] => {
  const keys: string[] = [node.key];
  for (const child of node.children ?? []) {
    keys.push(...collectAllKeys(child));
  }
  return keys;
};

const buildDeleteCategoryQuery = (ids: number[]): string =>
  `query { KBCategory { DeleteCategory(input: { ids: [${ids.join(", ")}] }) { statusCode success message data } } }`;

const deleteCategoryViaApi = async (key: string, tree: CategoryNode[]): Promise<void> => {
  const node = findNode(tree, key);
  const ids = (node ? collectAllKeys(node) : [key]).map(Number);
  const res = await graphqlRequest<KBCategoryGraphQLData>({
    query: buildDeleteCategoryQuery(ids),
  });
  const deleteResponse = res.data?.KBCategory?.DeleteCategory;
  // if (deleteResponse.statusCode == 400) {
     
  // }
  if (!isRecord(deleteResponse) || !deleteResponse.success) {
    console.error("[DeleteCategory] failed:", deleteResponse);
    throw new Error("Failed to delete category");
  }
};

const buildTreeFromFlat = (items: unknown[]): CategoryNode[] => {
  const records = items.filter(isRecord);
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const raw of records) {
    const nameTh = toStringValue(
      pickFirst(raw.name_th, raw.nameTh, raw.categoryName),
      "",
    );
    const nameEn = toNullableString(
      raw.name_en ?? raw.nameEn ?? null,
    );
    const node: CategoryNode = {
      key: toStringValue(pickFirst(raw.categoryId, raw.id), ""),
      title: nameTh || nameEn || "",
      nameTh,
      nameEn,
      articleCount: toNumber(raw.totalArticle, 0),
      children: [],
    };
    map.set(node.key, node);
  }

  for (const raw of records) {
    const key = toStringValue(pickFirst(raw.categoryId, raw.id), "");
    const node = map.get(key);
    if (!node) continue;
    const parentId = raw.parentId ?? raw.parentKey ?? null;
    if (parentId === null || parentId === undefined) {
      roots.push(node);
    } else {
      const parentKey = toStringValue(parentId);
      const parent = map.get(parentKey);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
        node.parentKey = parentKey;
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
};

const fetchCategoryListFromGraphQL = async (): Promise<CategoryNode[]> => {
  const res = await graphqlRequest<KBCategoryGraphQLData>({
    query:
      "query { KBCategory { GetCategoryList { statusCode success message data } } }",
  });
  const listResponse = res.data?.KBCategory?.GetCategoryList;
  if (!isRecord(listResponse) || !listResponse.success) {
    throw new Error("Failed to fetch category list");
  }
  const items = extractArrayPayload(listResponse.data);
  return buildTreeFromFlat(items);
};

interface MoveCategoryItem {
  id: number;
  parentId: number | null;
  seq: number;
}

const buildMoveCategoryQuery = (items: MoveCategoryItem[]): string => {
  const itemsStr = items
    .map(
      (item) =>
        `{ id: ${item.id}, parentId: ${item.parentId === null ? "null" : item.parentId}, seq: ${item.seq} }`,
    )
    .join(", ");
  return `query { KBCategory { MoveCategory(input:{ items: [${itemsStr}] }) { statusCode success message data } } }`;
};

const findSiblingsInner = (
  nodes: CategoryNode[],
  parentKey: string,
): CategoryNode[] | null => {
  for (const n of nodes) {
    if (n.key === parentKey) return n.children ?? [];
    if (n.children) {
      const found = findSiblingsInner(n.children, parentKey);
      if (found !== null) return found;
    }
  }
  return null;
};

const findSiblings = (
  nodes: CategoryNode[],
  parentKey: string | undefined,
): CategoryNode[] => {
  if (!parentKey) return nodes;
  return findSiblingsInner(nodes, parentKey) ?? [];
};

// ─── public API ───────────────────────────────────────────────────────────────

export const moveCategoryToApi = async (
  movedKey: string,
  newParentKey: string | undefined,
  updatedTree: CategoryNode[],
): Promise<void> => {
  movedKey = movedKey ?? "";
  if (General.CATEGORY_DATA_SOURCE !== "api") return;
  const siblings = findSiblings(updatedTree, newParentKey);
  const numParentId = newParentKey ? Number(newParentKey) : null;
  const items: MoveCategoryItem[] = siblings.map((node, index) => ({
    id: Number(node.key),
    parentId: numParentId,
    seq: index + 1,
  }));
  if (items.length === 0) {
    console.warn("[MoveCategory] no siblings found for parentKey:", newParentKey);
    return;
  }
  console.log("[MoveCategory] sending items:", items);
  const res = await graphqlRequest<KBCategoryGraphQLData>({
    query: buildMoveCategoryQuery(items),
  });
  const moveResponse = res.data?.KBCategory?.MoveCategory;
  if (!isRecord(moveResponse) || !moveResponse.success) {
    console.error("[MoveCategory] failed:", moveResponse);
    throw new Error("Failed to move category");
  }
};

export const getCategoryTree = async (): Promise<CategoryTreeResult> => {
  const nodes = await fetchCategoryListFromGraphQL();
  return { nodes };
};

export const applyCategoryAction = async (
  action: CategoryAction,
  currentTree?: CategoryNode[],
): Promise<CategoryTreeResult> => {
  await wait(80);
  const tree = cloneTree(currentTree ?? []);
  switch (action.type) {
    case "add": {
      const siblings = action.parentKey
        ? (findNode(tree, action.parentKey)?.children ?? [])
        : tree;
      const seq = siblings.length + 1;

      let newNode: CategoryNode;
      newNode = await createCategoryViaApi(
        action.nameTh,
        action.nameEn,
        action.parentKey,
        seq,
      );


      if (!action.parentKey) {
        tree.push(newNode);
      } else {
        const parent = findNode(tree, action.parentKey);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(newNode);
        }
      }
      break;
    }
    case "rename": {
      const node = findNode(tree, action.key);
      if (node) {

        const siblings = node.parentKey
          ? (findNode(tree, node.parentKey)?.children ?? [])
          : tree;
        const seq = siblings.findIndex((n) => n.key === action.key) + 1 || 1;
        await updateCategoryViaApi(
          action.key,
          action.nameTh,
          action.nameEn,
          node.parentKey,
          seq,
        );

        node.nameTh = action.nameTh;
        node.nameEn = action.nameEn;
        node.title = action.nameTh || action.nameEn || "";
      }
      break;
    }
    case "delete": {
      await deleteCategoryViaApi(action.key, tree);
      removeNode(tree, action.key);
      break;
    }
    case "move": {
      const node = findNode(tree, action.key);
      if (!node) break;
      removeNode(tree, action.key);
      node.parentKey = action.newParentKey;
      insertNode(tree, action.newParentKey, node, action.newIndex);
      break;
    }
  }

  return { nodes: cloneTree(tree) };
};
