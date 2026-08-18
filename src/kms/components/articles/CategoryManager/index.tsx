import React, { useCallback, useEffect, useState } from "react";
import { Tree, Tooltip, App as AntApp, Modal } from "antd";
import type { DataNode, EventDataNode } from "antd/es/tree";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
  applyCategoryAction,
  buildPath,
  getCategoryTree,
  moveCategoryToApi,
} from "@/kms/articles/service/category.service";
import { CategoryNode } from "@/kms/articles/dtos/category.dto";


// ─── props ────────────────────────────────────────────────────────────────────

interface CategoryManagerProps {
  onSelect?: (key: string, path: string) => void;
  selectOnly?: boolean;
  compact?: boolean;
  isCreate?: boolean;
  isEdit?: boolean;
  isDelete?: boolean;
}

// ─── form modal types ─────────────────────────────────────────────────────────

interface FormState {
  nameTh: string;
  nameEn: string;
}

interface FormModal {
  open: boolean;
  mode: "add" | "rename";
  parentKey?: string;
  nodeKey?: string;
  initial: FormState;
}

// ─── inline title renderer ────────────────────────────────────────────────────

interface NodeTitleProps {
  node: CategoryNode;
  displayName: string;
  onOpenRename: (node: CategoryNode) => void;
  onDelete: (key: string) => void;
  onAddChild: (parentKey: string) => void;
  onSelect?: (key: string) => void;
  selectOnly?: boolean;
  isDelete?: boolean;
  isCreate?: boolean;
  isEdit?: boolean;
}

const NodeTitle: React.FC<NodeTitleProps> = ({
  node,
  displayName,
  onOpenRename,
  onDelete,
  onAddChild,
  onSelect,
  selectOnly = false,
  isDelete = false,
  isCreate = false,
  isEdit = false,
}) => {
  if (selectOnly) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(node.key)}
        onKeyDown={(e) => e.key === "Enter" && onSelect?.(node.key)}
        className="group/node inline-flex w-full cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 hover:text-violet-600 dark:hover:text-violet-400"
      >
        <span className="text-sm text-gray-800 dark:text-slate-200 group-hover/node:text-violet-600 dark:group-hover/node:text-violet-400">
          {displayName}
        </span>
        {node.articleCount > 0 && (
          <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-400 dark:bg-slate-700 dark:text-slate-500">
            {node.articleCount}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="group/node inline-flex items-center gap-1.5">
      <span className="text-sm text-gray-800 dark:text-slate-200">
        {displayName}
      </span>
      {node.articleCount > 0 && (
        <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-400 dark:bg-slate-700 dark:text-slate-500">
          {node.articleCount}
        </span>
      )}
      <span className="invisible ml-1 inline-flex items-center gap-0.5 group-hover/node:visible">
        {onSelect && (
          <Tooltip title="Select">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node.key);
              }}
              className="rounded p-0.5 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          </Tooltip>
        )}
        {isCreate && (

          <Tooltip title="Add child">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node.key);
              }}
              className="rounded p-0.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </Tooltip>

        )}

        {isEdit && (
          <Tooltip title="Rename">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenRename(node);
              }}
              className="rounded p-0.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </Tooltip>

        )}


        {isDelete && (

          <Tooltip title="Delete">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.key);
              }}
              className="rounded p-0.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </Tooltip>
        )}

      </span>
    </span>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const CategoryManager: React.FC<CategoryManagerProps> = ({
  onSelect,
  selectOnly = false,
  compact = false,
  isCreate = false,
  isEdit = false,
  isDelete = false,
}) => {

  const { t, language } = useTranslation();
  const i18n = {
    language: language
  }
  const { message, modal,notification  } = AntApp.useApp();

  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const [formModal, setFormModal] = useState<FormModal>({
    open: false,
    mode: "add",
    initial: { nameTh: "", nameEn: "" },
  });
  const [formState, setFormState] = useState<FormState>({
    nameTh: "",
    nameEn: "",
  });

  const getNodeName = (node: CategoryNode): string =>
    i18n.language === "th"
      ? node.nameTh || node.nameEn || ""
      : node.nameEn || node.nameTh || "";

  const loadTree = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCategoryTree();
      setTree(result.nodes);
      setExpandedKeys(result.nodes.map((n: CategoryNode) => n.key));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  const filterNodes = (nodes: CategoryNode[], q: string): CategoryNode[] => {
    if (!q) return nodes;
    return nodes.reduce<CategoryNode[]>((acc, n) => {
      const filteredChildren = n.children ? filterNodes(n.children, q) : [];
      const lq = q.toLowerCase();
      const matches =
        n.nameTh.toLowerCase().includes(lq) ||
        (n.nameEn ?? "").toLowerCase().includes(lq) ||
        filteredChildren.length > 0;
      if (matches) {
        acc.push({
          ...n,
          children: filteredChildren.length > 0 ? filteredChildren : n.children,
        });
      }
      return acc;
    }, []);
  };

  const visibleTree = filterNodes(tree, search);

  const getAllKeys = (nodes: CategoryNode[]): React.Key[] => {
    const keys: React.Key[] = [];
    const collect = (ns: CategoryNode[]) => {
      for (const n of ns) {
        keys.push(n.key);
        if (n.children?.length) collect(n.children);
      }
    };
    collect(nodes);
    return keys;
  };

  // ─── modal helpers ─────────────────────────────────────────────────────────

  const openAddModal = (parentKey?: string) => {
    const initial = { nameTh: "", nameEn: "" };
    setFormModal({ open: true, mode: "add", parentKey, initial });
    setFormState(initial);
  };

  const openRenameModal = (node: CategoryNode) => {
    const initial = { nameTh: node.nameTh, nameEn: node.nameEn ?? "" };
    setFormModal({ open: true, mode: "rename", nodeKey: node.key, initial });
    setFormState(initial);
  };

  const closeFormModal = () => {
    setFormModal((prev) => ({ ...prev, open: false }));
  };

  const handleFormSubmit = async () => {
    const nameTh = formState.nameTh.trim();
    const nameEn = formState.nameEn.trim() || null;

    if (!nameTh && !nameEn) return;

    try {
      if (formModal.mode === "add") {
        const result = await applyCategoryAction({
          type: "add",
          parentKey: formModal.parentKey,
          nameTh,
          nameEn,
        }, tree);
        setTree(result.nodes);
        if (formModal.parentKey) {
          setExpandedKeys((prev) =>
            prev.includes(formModal.parentKey!)
              ? prev
              : [...prev, formModal.parentKey!],
          );
        }
        void message.success(t("knowledge.articles.category.added"));
      } else if (formModal.mode === "rename" && formModal.nodeKey) {
        const result = await applyCategoryAction({
          type: "rename",
          key: formModal.nodeKey,
          nameTh,
          nameEn,
        }, tree);
        setTree(result.nodes);
        void message.success(t("knowledge.articles.category.renamed"));
      }
    } catch {
      void message.error(t("knowledge.articles.category.errorGeneric"));
    }

    closeFormModal();
  };

  // ─── actions ──────────────────────────────────────────────────────────────

  const handleDelete = (key: string) => {
    modal.confirm({
      title: t("knowledge.articles.category.confirmDeleteTitle"),
      content: t("knowledge.articles.category.confirmDeleteBody"),
      okText: t("knowledge.articles.category.delete"),
      okButtonProps: { danger: true },
      cancelText: t("knowledge.articles.category.cancel"),
      onOk: async () => {
        try {
          const result = await applyCategoryAction(
            { type: "delete", key },
            tree
          );
          setTree(result.nodes);
          notification .success({
              message:t("knowledge.articles.category.deleted"),
              placement: "bottomRight",
          });
        } catch (err) {
          console.log(err)
             notification.error({
              message:t("knowledge.articles.category.cannotdelete"),
              placement: "bottomRight",
          });
          //throw err; // สำคัญ: ให้ modal รู้ว่า failed (optional แต่แนะนำ)
        }
      },
    });
  };

  const handleDrop = async (info: {
    node: EventDataNode<DataNode>;
    dragNode: EventDataNode<DataNode>;
    dropPosition: number;
    dropToGap: boolean;
  }) => {
    const dropKey = String(info.node.key);
    const dragKey = String(info.dragNode.key);
    const dropPos = info.node.pos.split("-");
    const dropIndex = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    let newParentKey: string | undefined;
    let newIndex: number;

    if (!info.dropToGap) {
      newParentKey = dropKey;
      newIndex = 0;
    } else {
      const parentNode = info.node;
      const parentPos = parentNode.pos.split("-").slice(0, -1).join("-");
      const findByPos = (
        nodes: CategoryNode[],
        pos: string,
        cur = "0",
      ): string | undefined => {
        for (let i = 0; i < nodes.length; i++) {
          const p = `${cur}-${i}`;
          if (p === pos) return nodes[i].key;
          if (nodes[i].children) {
            const found = findByPos(nodes[i].children!, pos, p);
            if (found) return found;
          }
        }
        return undefined;
      };
      newParentKey = parentPos === "0" ? undefined : findByPos(tree, parentPos);
      newIndex = Math.max(0, dropIndex);
    }

    try {
      const result = await applyCategoryAction({
        type: "move",
        key: dragKey,
        newParentKey,
        newIndex,
      }, tree);
      setTree(result.nodes);
      await moveCategoryToApi(dragKey, newParentKey, result.nodes);
    } catch {
      void message.error(t("knowledge.articles.category.errorGeneric"));
    }
  };

  const buildDataNodes = (nodes: CategoryNode[]): DataNode[] =>
    nodes.map((n) => ({
      key: n.key,
      title: (
        <NodeTitle
          node={n}
          displayName={getNodeName(n)}
          onOpenRename={openRenameModal}
          onDelete={handleDelete}
          onAddChild={(parentKey) => openAddModal(parentKey)}
          selectOnly={selectOnly}
          isCreate={isCreate}
          isEdit={isEdit}
          isDelete={isDelete}
          onSelect={
            onSelect
              ? (key) => {
                const path =
                  buildPath(tree, key, [], i18n.language) ?? getNodeName(n);
                onSelect(key, path);
              }
              : undefined
          }
        />
      ),
      children: n.children ? buildDataNodes(n.children) : undefined,
      isLeaf: !n.children || n.children.length === 0,
    }));

  const formModalTitle =
    formModal.mode === "add"
      ? t("knowledge.articles.category.addRoot")
      : t("knowledge.articles.category.rename", { defaultValue: "Rename" });

  return (
    <div className={compact ? "flex h-full flex-col" : "flex h-full flex-col"}>
      {/* Toolbar */}
      <div
        className={`flex flex-wrap items-center gap-3 ${compact ? "mb-3" : "mb-4"}`}
      >
        <div className="flex flex-1 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <svg
            className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("knowledge.articles.category.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Tooltip title={t("knowledge.articles.category.expandAll", { defaultValue: "Expand all" })}>
            <button
              type="button"
              onClick={() => setExpandedKeys(getAllKeys(tree))}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip title={t("knowledge.articles.category.collapseAll", { defaultValue: "Collapse all" })}>
            <button
              type="button"
              onClick={() => setExpandedKeys([])}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </Tooltip>
          <Tooltip title={t("knowledge.articles.category.refresh", { defaultValue: "Refresh" })}>
            <button
              type="button"
              onClick={() => void loadTree()}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </Tooltip>
        </div>

        {(!selectOnly && isCreate) && (

          <button
            type="button"
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t("knowledge.articles.category.addRoot")}
          </button>
        )}
      </div>

      {/* Tree */}
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-gray-100 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-5 rounded bg-gray-100 dark:bg-slate-800"
                style={{ width: `${60 + i * 7}%`, marginLeft: (i % 3) * 16 }}
              />
            ))}
          </div>
        ) : visibleTree.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">
            {search ? t("knowledge.articles.category.noResults") : t("knowledge.articles.category.empty")}
          </p>
        ) : (
          <Tree
            treeData={buildDataNodes(visibleTree)}
            draggable={!selectOnly}
            blockNode
            showLine={{ showLeafIcon: false }}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys)}
            onDrop={selectOnly ? undefined : handleDrop}
            className="!bg-transparent [&_.ant-tree-node-content-wrapper:hover]:!bg-violet-50 dark:[&_.ant-tree-node-content-wrapper:hover]:!bg-violet-900/20 [&_.ant-tree-node-selected]:!bg-violet-100 dark:[&_.ant-tree-node-selected]:!bg-violet-900/40 [&_.ant-tree-switcher]:text-gray-500"
          />
        )}
      </div>


      {!selectOnly && (
        <p className="mt-2 text-center text-xs text-gray-400 dark:text-slate-600">
          {t("knowledge.articles.category.dragHint")}
        </p>
      )}

      {/* Category form modal */}
      <Modal
        open={formModal.open}
        title={formModalTitle}
        onCancel={closeFormModal}
        footer={null}
        centered
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Name (Thai)
            </label>
            <input
              value={formState.nameTh}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, nameTh: e.target.value }))
              }
              autoFocus
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleFormSubmit();
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Name (English)
            </label>
            <input
              value={formState.nameEn}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, nameEn: e.target.value }))
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleFormSubmit();
              }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeFormModal}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t("knowledge.articles.category.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void handleFormSubmit()}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              {t("knowledge.articles.category.add", { defaultValue: "Save" })}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManager;
