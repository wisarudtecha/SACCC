// src/cms/components/workflow/editor/Editor.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { FormField } from "@/cms/components/interface/FormField";
import { usePermissions } from "@/core/hooks/usePermissions";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useCreateWorkflowMutation, useUpdateWorkflowMutation } from "@/cms/store/api/workflowApi";
import type { BaseNode, Connection, Position, WorkflowConnection, WorkflowData, WorkflowNode, WorkflowEditorComponentProps } from "@/cms/types/workflow";
import Canvas from "@/cms/components/workflow/editor/Canvas";
import ComponentsPreviewModal from "@/cms/components/workflow/editor/ComponentsPreviewModal";
import ConfigPanel from "@/cms/components/workflow/editor/ConfigPanel";
import ImportModal from "@/cms/components/workflow/editor/ImportModal";
import JsonPreviewModal from "@/cms/components/workflow/editor/JsonPreviewModal";
import Toolbar from "@/cms/components/workflow/editor/Toolbar";

// Grid configuration
const GRID_SIZE = 20 as const;
const NODE_WIDTH = 96 as const; // 24 * 4 (w-24)
const NODE_HEIGHT = 64 as const; // 16 * 4 (h-16)

const WorkflowEditorComponent: React.FC<WorkflowEditorComponentProps> = ({
  caseStatuses,
  forms,
  requestStatuses,
  userGroup,
  users,
  workflowAction,
  workflowData,
  workflowId,
  initialData = {
    nodes: [],
    connections: [],
    metadata: {
      title: "Untitled Workflow",
      description: "",
      status: "draft",
      totalSla: 0,
      createdAt: new Date().toISOString(),
      wfType: ""
    }
  },
  onSave
}) => {
  // ===================================================================
  // Hooks
  // ===================================================================

  const permissions = usePermissions();
  const { toasts, addToast, removeToast } = useToast();
  const { language, t } = useTranslation();

  // Node type configurations
  const nodeTypes = {
    start: {
      button: "bg-success-500 text-white dark:text-white hover:bg-success-600",
      color: "bg-success-500 dark:bg-success-400",
      label: t("crud.workflow.builder.toolbar.nodes.start")
    },
    process: {
      button: "bg-brand-500 text-white dark:text-white hover:bg-brand-600",
      color: "bg-brand-500 dark:bg-brand-400",
      label: t("crud.workflow.builder.toolbar.nodes.process")
    },
    dispatch: {
      button: "bg-gray-500 text-white dark:text-white hover:bg-gray-600",
      color: "bg-gray-500 dark:bg-gray-400",
      label: t("crud.workflow.builder.toolbar.nodes.dispatch")
    },
    sla: {
      button: "bg-purple-500 text-white dark:text-white hover:bg-purple-600",
      color: "bg-purple-500 dark:bg-purple-400",
      label: t("crud.workflow.builder.toolbar.nodes.sla")
    },
    decision: {
      button: "bg-warning-500 text-white dark:text-white hover:bg-warning-600",
      color: "bg-warning-500 dark:bg-warning-400",
      label: t("crud.workflow.builder.toolbar.nodes.decision")
    },
    end: {
      button: "bg-error-500 text-white dark:text-white hover:bg-error-600",
      color: "bg-error-500 dark:bg-error-400",
      label: t("crud.workflow.builder.toolbar.nodes.end")
    }
  } as const;

  // Workflow status options
  const workflowStatuses = [
    { value: "draft", label: t("crud.workflow.builder.metadata.status.options.draft"), color: "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800" },
    { value: "active", label: t("crud.workflow.builder.metadata.status.options.active"), color: "text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800" },
    { value: "inactive", label: t("crud.workflow.builder.metadata.status.options.inactive"), color: "text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-800" },
    { value: "testing", label: t("crud.workflow.builder.metadata.status.options.testing"), color: "text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-800" }
  ] as const;

  // ===================================================================
  // API Mutations
  // ===================================================================

  const [createWorkflow] = useCreateWorkflowMutation();
  const [updateWorkflow] = useUpdateWorkflowMutation();

  // ===================================================================
  // Component State
  // ===================================================================

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ===================================================================
  // State Variables
  // ===================================================================

  const [connectingFrom, setConnectingFrom] = useState<"yes" | "no" | null>(null);
  const [connections, setConnections] = useState<Connection[]>(initialData?.connections || []);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [draggedNodeType, setDraggedNodeType] = useState<BaseNode["type"] | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [nodes, setNodes] = useState<BaseNode[]>(initialData?.nodes || []);
  const [selectedNode, setSelectedNode] = useState<BaseNode | null>(null);
  const [showComponentsPreview, setShowComponentsPreview] = useState<boolean>(false);
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [tempConnection, setTempConnection] = useState<Position | null>(null);
  const [
    validationErrors,
    // setValidationErrors
  ] = useState<string[]>([]);
  const [workflowMetadata, setWorkflowMetadata] = useState<WorkflowData["metadata"]>(initialData?.metadata);
  // Enhanced state for Components Preview
  const [decisionSelections, setDecisionSelections] = useState<Record<string, "yes" | "no">>({});
  const [loading, setLoading] = useState(false);
  
  // ===================================================================
  // Derived State
  // ===================================================================

  // Determine if the workflow is editable
  const editable = workflowId === "new" || (workflowId !== "new" && workflowAction === "edit");

  const decisionLang: Record<string, string> = {
    yes: language === "th" && "ใช่" || "Yes", no: language === "th" && "ไม่" || "No"
  };

  // ===================================================================
  // Helper Functions
  // ===================================================================
  
  // Prepare case status options for Select component
  const caseStatusOptions = useMemo(() => (
    Array?.isArray(caseStatuses)
      ? caseStatuses?.map(caseStatus => ({
          value: caseStatus?.statusId || "",
          label: language === "th" && caseStatus?.th || caseStatus?.en || ""
        }))
      : []
  ), [caseStatuses, language]);

  // Prepare form options for Select component
  const formOptions = Array?.isArray(forms) && forms?.map(form => {
    return { value: form?.formId || "", label: form?.formName || "" };
  }) || [];

  // Prepare user options for Select component
  const userOptions = Array?.isArray(users) && users?.map(user => {
    return { value: user?.username || "", label: user?.displayName || user?.username || "" };
  }) || [];

  // Prepare group options for Select component
  const groupOptions = Array?.isArray(userGroup) && userGroup?.map(ug => {
    return { value: ug?.grpId || "", label: language === "th" && ug?.th || ug?.en || "" };
  }) || [];

  // Prepare workflow status options for Select component
  const workflowStatusesOptions = Array?.isArray(workflowStatuses) && workflowStatuses?.map(status => ({
    value: status?.value,
    label: status?.label
  })) || [];

  // Prepare request status options for Select component
  const requestStatusOptions = useMemo(() => (
    Array?.isArray(requestStatuses)
      ? requestStatuses?.map(requestStatus => ({
          value: requestStatus?.statusId || "",
          label: language === "th" && requestStatus?.th || requestStatus?.en || ""
        }))
      : []
  ), [requestStatuses, language]);

  const countSLA = useCallback(() => {
    return nodes?.reduce((total, node) => {
      const config = node.data.config;
      const slaValue = (config?.SLA ?? config?.sla) || undefined;
      if (slaValue !== undefined && !isNaN(Number(slaValue))) {
        return total + Number(slaValue);
      }
      return total;
    }, 0);
  }, [nodes]);

  // Update workflow metadata
  const updateWorkflowMetadata = useCallback((updates: Partial<typeof workflowMetadata>) => {
    setWorkflowMetadata(prev => ({ ...prev, ...updates }));
  }, []);

  // Load workflow data from URL if workflowId is provided
  useEffect(() => {
    if (workflowId && workflowId !== "new") {
      const loadWorkflowFromUrl = async () => {
        try {
          const { nodes, connections, metadata } = workflowData as {
            nodes: WorkflowNode[];
            connections: WorkflowConnection[];
            metadata: {
              title: string;
              description: string;
              status: string;
              createdAt: string;
            };
          };
          
          setNodes(
            nodes?.map(n => ({
              ...n,
              type: n?.type as BaseNode["type"],
            })) || null
          );

          setConnections(connections);

          if (metadata) {
            setWorkflowMetadata({
              ...metadata,
              status: metadata?.status as WorkflowData["metadata"]["status"],
            });
          }
        }
        catch (error) {
          console.error("Failed to load workflow:", error);
        }
      };
      
      if (workflowData) {
        loadWorkflowFromUrl();
      }
    }
  }, [workflowData, workflowId]);

  useEffect(() => {
    updateWorkflowMetadata({ totalSla: countSLA() });
  }, [countSLA, updateWorkflowMetadata]);

  const findNodeByAction = useCallback((action: string, type?: string): BaseNode | undefined => {
    if (type === "dispatch") {
      return nodes.find(node => node?.data?.config?.action === action && node?.type === type);
    }
    return nodes.find(node => node?.data?.config?.action === action);
  }, [nodes]);

  // Validate workflow before saving
  const validateWorkflow = useCallback((): string[] => {
    const errors: string[] = [];

    ["start", "dispatch", "end"]?.map(n => {
      if (!nodes?.some(node => node?.type === n)) {
        // let nodeName = "";
        // if (n === "start") {
        //   nodeName = t("crud.workflow.builder.toolbar.nodes.start");
        // }
        // else if (n === "dispatch") {
        //   nodeName = t("crud.workflow.builder.toolbar.nodes.dispatch");
        // }
        // else if (n === "end") {
        //   nodeName = t("crud.workflow.builder.toolbar.nodes.end");
        // }
        // errors?.push(t("crud.workflow.builder.node.validation.node_required").replace("_NODE_", nodeName));
      }
    });

    ["S001", "S003", "S007"]?.map(a => {
      const actionValue = caseStatusOptions?.find(s => s?.value === a);
      // const actionLabel = actionValue?.label?.toLowerCase() || "";
      // const isDispatch = actionValue?.label?.toLowerCase()?.replace("ed", "") || "";
      const isDispatch = actionValue?.value === "S003" && "dispatch" || ""
      if (isDispatch === "dispatch") {
        if (!findNodeByAction(actionValue?.value || "", isDispatch || "")) {
          // errors?.push(t("crud.workflow.builder.node.validation.action_required")
          //   .replace("_ACTION_", actionLabel)
          //   .replace("_NODE_", t("crud.workflow.builder.toolbar.nodes.dispatch"))
          // );
        }
      }
      else {
        if (!findNodeByAction(actionValue?.value || "")) {
          // errors?.push(t("crud.workflow.builder.node.validation.action_required")
          //   .replace("_ACTION_", actionLabel)
          //   .replace("_NODE_", t("crud.workflow.builder.toolbar.nodes.process"))
          // );
        }
      }
    });
    
    // const hasStartNode = nodes?.some(node => node?.type === "start");
    // const hasEndNode = nodes?.some(node => node?.type === "end");
    
    // if (!hasStartNode) {
    //   errors?.push("Workflow must have at least one Start node");
    // }
    
    // if (!hasEndNode) {
    //   errors?.push("Workflow must have at least one End node");
    // }
    
    // Validate connection limits
    const connectionCounts = nodes?.reduce((acc, node) => {
      const outgoingConnections = connections?.filter(conn => conn?.source === node?.id);
      acc[node?.id] = outgoingConnections?.length;
      return acc;
    }, {} as Record<string, number>);
    
    nodes?.forEach(node => {
      const count = connectionCounts[node?.id] || 0;
      if ((node?.type === "start" || node?.type === "process" || node?.type === "dispatch" || node?.type === "end") && count > 1) {
        // errors?.push(`${node?.data?.label} can only have 1 outgoing connection`);
      }
      if ((node?.type === "decision" || node?.type === "sla") && count > 2) {
        // errors?.push(`${node?.data?.label} can only have 2 outgoing connections (Yes/No)`);
      }
    });
    
    return errors;
  }, [
    caseStatusOptions,
    connections,
    nodes,
    findNodeByAction,
    // t
  ]);

  // Snap position to grid
  const snapToGrid = useCallback((position: Position): Position => {
    return {
      x: Math?.round(position?.x / GRID_SIZE) * GRID_SIZE,
      y: Math?.round(position?.y / GRID_SIZE) * GRID_SIZE
    };
  }, []);

  // Calculate connection point on node border
  const getNodeConnectionPoint = useCallback((fromPos: Position, toPos: Position, isSource: boolean): Position => {
    const nodeCenter = {
      x: (isSource ? fromPos?.x : toPos?.x) + NODE_WIDTH / 2,
      y: (isSource ? fromPos?.y : toPos?.y) + NODE_HEIGHT / 2
    };
    
    const otherCenter = {
      x: (isSource ? toPos?.x : fromPos?.x) + NODE_WIDTH / 2,
      y: (isSource ? toPos?.y : fromPos?.y) + NODE_HEIGHT / 2
    };

    // Calculate which side to connect from/to
    const dx = otherCenter?.x - nodeCenter?.x;
    const dy = otherCenter?.y - nodeCenter?.y;
    
    const nodeHalfWidth = NODE_WIDTH / 2;
    const nodeHalfHeight = NODE_HEIGHT / 2;
    
    // Determine connection side based on direction
    if (Math?.abs(dx) > Math?.abs(dy)) {
      // Horizontal connection (left/right)
      return {
        x: nodeCenter?.x + (dx > 0 ? nodeHalfWidth : -nodeHalfWidth),
        y: nodeCenter?.y
      };
    }
    else {
      // Vertical connection (top/bottom)
      return {
        x: nodeCenter?.x,
        y: nodeCenter?.y + (dy > 0 ? nodeHalfHeight : -nodeHalfHeight)
      };
    }
  }, []);

  // Enhanced path traversal for Components Preview
  const getWorkflowPath = useCallback((startNodeId: string, decisions: Record<string, "yes" | "no">): string[] => {
    const path: string[] = [];
    const visited = new Set<string>();
    
    const traverse = (nodeId: string) => {
      if (visited?.has(nodeId)) {
        return;
      }
      visited?.add(nodeId);
      
      const node = nodes?.find(n => n?.id === nodeId);
      if (!node) {
        return;
      }
      
      path?.push(nodeId);
      
      if (node?.type === "end") {
        return;
      }
      
      const outgoingConnections = connections?.filter(c => c?.source === nodeId);
      
      if (node?.type === "decision" || node?.type === "sla") {
        const selectedPath = decisions[nodeId] || "yes"; // Default to yes
        const connection = outgoingConnections?.find(c => c?.label === selectedPath);
        if (connection) {
          traverse(connection?.target);
        }
      }
      else {
        // For non-decision nodes, follow the first connection
        if (outgoingConnections?.length > 0) {
          traverse(outgoingConnections[0]?.target);
        }
      }
    };
    
    traverse(startNodeId);
    return path;
  }, [nodes, connections]);

  // Generate components preview based on workflow path
  const generateComponentsPreview = useCallback(() => {
    const startNodes = nodes?.filter(n => n?.type === "start");
    if (startNodes?.length === 0) {
      return [];
    }

    const pathNodes = getWorkflowPath(startNodes[0]?.id, decisionSelections);

    type PreviewComponent =
      {
        type: "start";
        id: string;
        label: string;
        description?: string;
        continueFromWorkflow?: boolean;
        sourceWorkflowId?: string;
      } |
      {
        type: "process";
        id: string;
        label: string;
        form?: FormField;
        action?: string;
        sla?: string | number;
        group?: string;
        pic?: string;
      } |
      {
        type: "dispatch";
        id: string;
        label: string;
        form?: FormField;
        action?: string;
        sla?: string | number;
        group?: string;
        pic?: string;
      } |
      {
        type: "sla";
        id: string;
        label: string;
        SLA?: string | number;
      } |
      {
        type: "decision";
        id: string;
        label: string;
        condition?: string;
      } |
      {
        type: "end";
        id: string;
        label: string;
        description?: string;
        allowContinuation?: boolean;
        nextWorkflowId?: string;
      };

    const components: PreviewComponent[] = [];

    pathNodes?.forEach(nodeId => {
      const node = nodes?.find(n => n?.id === nodeId);
      if (!node) {
        return;
      }

      if (node?.type === "start") {
        components?.push({
          type: "start",
          id: node?.id,
          label: node?.data?.label,
          description: node?.data?.description,
          continueFromWorkflow: node?.data?.config?.continueFromWorkflow === true,
          sourceWorkflowId: typeof node?.data?.config?.sourceWorkflowId === "string" ? node?.data?.config?.sourceWorkflowId : undefined
        });
      }
      else if (node?.type === "process" || node?.type === "dispatch") {
        components?.push({
          type: node?.type === "dispatch" ? "dispatch" : "process",
          id: node?.id,
          label: node?.data?.label,
          form: forms?.find(f => f?.formId === node?.data?.config?.formId),
          sla: typeof node?.data?.config?.sla === "string" || typeof node?.data?.config?.sla === "number" ? node?.data?.config?.sla : undefined,
          action: language === "th" && (
            caseStatuses?.find(a => a?.statusId === node?.data?.config?.action)?.th || caseStatuses?.find(a => a?.statusId === node?.data?.config?.action)?.en
          ) || "",
          group: Array?.isArray(node?.data?.config?.group)
            ? node?.data?.config?.group?.map((gid: string) => language === "th" && (
              userGroup?.find(ug => ug?.grpId === gid)?.th || userGroup?.find(ug => ug?.grpId === gid)?.en
            ) || gid)?.join(", ")
            : (typeof node?.data?.config?.group === "string"
              ? language === "th" && (
                userGroup?.find(ug => ug?.grpId === node?.data?.config?.group)?.th || userGroup?.find(ug => ug?.grpId === node?.data?.config?.group)?.en
              ) ||
                node?.data?.config?.group
              : undefined),
          pic: Array?.isArray(node?.data?.config?.pic)
            ? node?.data?.config?.pic?.map((pid: string) => users?.find(u => u?.id === pid)?.displayName || users?.find(u => u?.id === pid)?.username || pid)?.join(", ")
            : (typeof node?.data?.config?.pic === "string"
              ? users?.find(u => u?.id === node?.data?.config?.pic)?.displayName || 
                users?.find(u => u?.id === node?.data?.config?.pic)?.username || 
                node.data?.config?.pic
              : undefined),
        });
      }
      else if (node?.type === "sla") {
        components?.push({
          type: "sla",
          id: node?.id,
          label: node?.data?.label,
          SLA: typeof node?.data?.config?.SLA === "string" || typeof node?.data?.config?.SLA === "number" ? node?.data?.config?.SLA : undefined
        });
      }
      else if (node?.type === "decision") {
        components?.push({
          type: "decision",
          id: node?.id,
          label: node?.data?.label,
          condition: typeof node?.data?.config?.condition === "string" ? node?.data?.config?.condition : undefined
        });
      }
      else if (node?.type === "end") {
        components?.push({
          type: "end",
          id: node?.id,
          label: node?.data?.label,
          description: node?.data?.description,
          allowContinuation: node?.data?.config?.allowContinuation === true,
          nextWorkflowId: typeof node?.data?.config?.nextWorkflowId === "string" ? node?.data?.config?.nextWorkflowId : undefined
        });
      }
    });
    
    return components;
  }, [
    caseStatuses,
    forms,
    nodes,
    decisionSelections,
    language,
    userGroup,
    users,
    getWorkflowPath
  ]);

  // Handle decision toggle in Components Preview
  const handleDecisionToggle = useCallback((nodeId: string, decision: "yes" | "no") => {
    setDecisionSelections(prev => ({
      ...prev,
      [nodeId]: decision
    }));
  }, []);

  // Add new node with dynamic grid positioning
  const addNode = useCallback((type: BaseNode["type"], position?: Position) => {
    // Calculate dynamic grid position if not provided
    let nodePosition = position;
    if (!nodePosition) {
      // Get the current scroll position of the canvas
      const canvasElement = canvasRef.current;
      const scrollLeft = canvasElement?.scrollLeft || 0;
      const scrollTop = canvasElement?.scrollTop || 0;
      
      // Position new nodes at top-left of visible canvas area with some padding
      const baseX = scrollLeft + GRID_SIZE * 2; // 2 grid units from left edge
      const baseY = scrollTop + GRID_SIZE * 4; // 4 grid units from top edge

      // Find next available grid position
      const existingPositions = nodes.map(n => n?.position);

      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 8; col++) {
          const testPosition = {
            x: baseX + col * (NODE_WIDTH + GRID_SIZE),
            y: baseY + row * (NODE_HEIGHT + GRID_SIZE)
          };
          
          const isOccupied = existingPositions?.some(pos => 
            Math?.abs(pos?.x - testPosition?.x) < NODE_WIDTH && 
            Math?.abs(pos?.y - testPosition?.y) < NODE_HEIGHT
          );
          
          if (!isOccupied) {
            nodePosition = snapToGrid(testPosition);
            break;
          }
        }
        if (nodePosition) break;
      }
      
      // Fallback position if no free spot found
      if (!nodePosition) {
        nodePosition = snapToGrid({ x: baseX, y: baseY });
      }
    }

    // Initialize config based on node type
    let initialConfig = {};
    if (type === "start") {
      initialConfig = {
        continueFromWorkflow: false,
        sourceWorkflowId: ""
      };
    }
    else if (type === "end") {
      initialConfig = {
        allowContinuation: false,
        nextWorkflowId: ""
      };
    }
    // SLA nodes now get the same initial config as decision nodes
    else if (type === "decision") {
      initialConfig = {
        condition: ""
      };
    }

    const newNode: BaseNode = {
      id: `node-${Date.now()}`,
      type,
      position: nodePosition,
      data: {
        label: `${nodeTypes[type]?.label} ${nodes?.filter(n => n?.type === type)?.length + 1}`,
        description: "",
        config: initialConfig
      }
    };
    
    setNodes(prev => [...prev, newNode]);
    // Automatically select the newly added node
    setSelectedNode(newNode);
    
    return newNode;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, snapToGrid]);

  // Handle drag start from node palette
  const handleDragStart = useCallback((e: React.DragEvent, nodeType: BaseNode["type"]) => {
    setDraggedNodeType(nodeType);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer?.setData("text/plain", nodeType);
  }, []);

  // Handle drag over canvas
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e?.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle drop on canvas
  const handleDrop = useCallback((e: React.DragEvent) => {
    e?.preventDefault();
    
    if (draggedNodeType) {
      const rect = canvasRef?.current?.getBoundingClientRect();
      if (rect) {
        const position = snapToGrid({
          x: e?.clientX - rect?.left - NODE_WIDTH / 2,
          y: e?.clientY - rect?.top - NODE_HEIGHT / 2
        });
        
        const newNode = addNode(draggedNodeType, position);
        
        // Automatically handle mouse down for the newly added node
        setTimeout(() => {
          if (newNode) {
            setSelectedNode(newNode);
          }
        }, 50);
      }
    }
    
    setDraggedNodeType(null);
  }, [draggedNodeType, addNode, snapToGrid]);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = canvasRef?.current?.getBoundingClientRect();
    if (rect) {
      const x = e?.clientX - rect?.left;
      const y = e?.clientY - rect?.top;
      
      // Only clear preview if actually leaving the canvas area
      if (x < 0 || y < 0 || x > rect?.width || y > rect?.height) {
        // Handle drag leave
      }
    }
  }, []);

  // Handle mouse down on node
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e?.stopPropagation();
    const node = nodes?.find(n => n?.id === nodeId);
    if (!node) {
      return;
    }

    if (e?.shiftKey && editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"])) {
      // Shift + click to start connection

      // Check connection limits
      const outgoingConnections = connections?.filter(conn => conn?.source === nodeId);
      const maxConnections = (node?.type === "decision" || node?.type === "sla") ? 2 : 1;
      
      if (outgoingConnections.length >= maxConnections) {
        const nodeTypeName = node?.type === "decision" ? t("crud.workflow.builder.toolbar.nodes.decision")
          : (node?.type === "sla" && t("crud.workflow.builder.toolbar.nodes.sla") || "");
        // alert(`${nodeTypeName} node already has maximum connections`);
        alert(`${t("crud.workflow.builder.node.validation.maximum_connections").replace("_NODE_", nodeTypeName)}`);
        return;
      }
      
      // For decision or sla nodes, determine Yes/No connection
      if (node?.type === "decision" || node?.type === "sla") {
        const hasYes = outgoingConnections?.some(conn => conn?.label === "yes");
        const hasNo = outgoingConnections?.some(conn => conn?.label === "no");
        
        if (!hasYes) {
          setConnectingFrom("yes");
        }
        else if (!hasNo) {
          setConnectingFrom("no");
        }
        else {
          const nodeTypeName = node?.type === "decision" ? t("crud.workflow.builder.toolbar.nodes.decision") : t("crud.workflow.builder.toolbar.nodes.sla");
          // alert(`${nodeTypeName} node already has both Yes and No connections`);
          alert(`${t("crud.workflow.builder.node.validation.determine_connections").replace("_NODE_", nodeTypeName)}`);
          return;
        }
      }
      else {
        setConnectingFrom(null);
      }

      setIsConnecting(nodeId);
    }
    else {
      // Regular click to drag
      const rect = canvasRef?.current?.getBoundingClientRect();
      if (rect && editable && permissions?.hasAnyPermission(["workflow.create", "workflow.update"])) {
        setIsDragging(nodeId);
        setDragOffset({
          x: e?.clientX - rect?.left - node?.position?.x,
          y: e?.clientY - rect?.top - node?.position?.y
        });
      }
    }
    setSelectedNode(node);
  }, [
    connections,
    editable,
    nodes,
    permissions,
    t
  ]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef?.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const mousePos = {
      x: e?.clientX - rect?.left,
      y: e?.clientY - rect?.top
    };

    if (isDragging) {
      const newPosition = snapToGrid({
        x: mousePos?.x - dragOffset?.x,
        y: mousePos?.y - dragOffset?.y
      });

      setNodes(prev => prev?.map(node => 
        node?.id === isDragging ? { ...node, position: newPosition } : node
      ));
    }
    else if (isConnecting) {
      setTempConnection(snapToGrid(mousePos));
    }
  }, [
    dragOffset,
    isConnecting,
    isDragging,
    snapToGrid
  ]);

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isConnecting) {
      // Check if we"re over a node
      const target = e?.target as Element;
      const nodeElement = target?.closest("[data-node-id]");
      if (nodeElement) {
        const targetNodeId = nodeElement?.getAttribute("data-node-id");
        if (targetNodeId && targetNodeId !== isConnecting) {
          // Validate connection
          const targetNode = nodes?.find(n => n?.id === targetNodeId);
          const sourceNode = nodes?.find(n => n?.id === isConnecting);
          
          if (targetNode && sourceNode) {
            // Check if target can accept connections (start nodes cannot be targets)
            if (targetNode?.type === "start") {
              alert("Cannot connect to Start node");
              setIsConnecting(null);
              setConnectingFrom(null);
              setTempConnection(null);
              return;
            }
            
            // Check for duplicate connections
            const existingConnection = connections.find(conn => 
              conn?.source === isConnecting && conn.target === targetNodeId
            );
            
            if (existingConnection) {
              alert("Connection already exists");
              setIsConnecting(null);
              setConnectingFrom(null);
              setTempConnection(null);
              return;
            }
            
            const newConnection: Connection = {
              id: `connection-${Date.now()}`,
              source: isConnecting,
              target: targetNodeId,
              label: connectingFrom || undefined
            };
            setConnections(prev => [...prev, newConnection]);
          }
        }
      }
      setIsConnecting(null); 
      setConnectingFrom(null);
      setTempConnection(null);
    }
    setIsDragging(null);
  }, [
    connectingFrom,
    connections,
    isConnecting,
    nodes
  ]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev?.filter(n => n?.id !== nodeId));
    setConnections(prev => prev?.filter(c => c?.source !== nodeId && c?.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Update node data
  const updateNodeData = useCallback((nodeId: string, updates: Partial<BaseNode["data"]>) => {
    setNodes(prev => prev?.map(node => 
      node?.id === nodeId 
        ? { ...node, data: { ...node?.data, ...updates } }
        : node
    ));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, data: { ...prev?.data, ...updates } } : null);
    }
  }, [selectedNode]);

  // Import JSON workflow
  const importJsonWorkflow = useCallback(() => {
    try {
      const workflowData = JSON.parse(importJsonText);
      
      // Validate imported data structure
      if (!workflowData?.nodes || !workflowData?.connections || !workflowData?.metadata) {
        throw new Error("Invalid workflow format");
      }
      
      setNodes(workflowData?.nodes);
      setConnections(workflowData?.connections);
      setWorkflowMetadata(workflowData?.metadata);
      setImportJsonText("");
      setShowImportDialog(false);
    }
    catch (error) {
      alert("Invalid JSON format. Please check your input.");
      console.error("Import error:", error);
    }
  }, [importJsonText]);

  // Import from file
  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const content = e?.target?.result as string;
        setImportJsonText(content);
      };
      reader.readAsText(file);
    }
  }, []);

  // Download JSON workflow
  const downloadJsonWorkflow = useCallback(() => {
    const workflowData = {
      nodes,
      connections,
      metadata: {
        ...workflowMetadata,
        updatedAt: new Date().toISOString()
      }
    };
    
    const jsonString = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowMetadata?.title?.replace(/\s+/g, "_").toLowerCase()}_workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, connections, workflowMetadata]);

  // Copy JSON to clipboard
  const copyJsonToClipboard = useCallback(async () => {
    const workflowData = {
      nodes,
      connections,
      metadata: {
        ...workflowMetadata,
        updatedAt: new Date().toISOString()
      }
    };
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
    catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }, [nodes, connections, workflowMetadata]);

  // Save workflow
  const saveWorkflow = useCallback(async () => {
    const errors = validateWorkflow();
    // setValidationErrors(errors);

    if (errors?.length > 0) {
      // return; // Don"t save if there are validation errors
    }

    const workflowData: WorkflowData = {
      nodes,
      connections,
      metadata: {
        ...workflowMetadata,
        updatedAt: new Date().toISOString()
      }
    };
    onSave?.(workflowData);
    setShowJsonPreview(false);

    try {
      setLoading(true);

      let response;
      if (workflowId && workflowId !== "new" && permissions?.hasAnyPermission(["workflow.update"])) {
        response = await updateWorkflow({ id: workflowId, data: workflowData })?.unwrap();
      }
      else if (permissions?.hasAnyPermission(["workflow.create"])) {
        response = await createWorkflow(workflowData)?.unwrap();
      }

      if (response?.status) {
        addToast("success", `Workflow Management: ${response?.desc || response?.msg || "Save successfully"}`);
        setTimeout(() => {
          window.location.replace(`/cms/workflow/list/`);
        }, 1000);
      }
      else {
        throw new Error(response?.desc || response?.msg || "Unknown error");
      }
    }
    catch (error) {
      addToast("error", `Workflow Management: ${error}`);
    }
    finally {
      setLoading(false);
    }
  }, [
    connections,
    nodes,
    permissions,
    workflowId,
    workflowMetadata,
    addToast,
    createWorkflow,
    onSave,
    updateWorkflow,
    validateWorkflow,
  ]);

  // Show JSON preview before save
  const handleSaveClick = useCallback(() => {
    // const errors = validateWorkflow();
    // setValidationErrors(errors);
    setShowJsonPreview(true);
  }, [
    // validateWorkflow
  ]);

  // Get node position by ID
  const getNodePosition = useCallback((nodeId: string): Position => {
    const node = nodes?.find(n => n?.id === nodeId);
    return node ? node?.position : { x: 0, y: 0 };
  }, [nodes]);

  const CanvasProps = {
    canvasRef,
    editable,
    permissions,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleMouseUp,
    handleMouseMove,
    svgRef,
    GRID_SIZE
  };

  const ComponentsPreviewModalProps = {
    showComponentsPreview,
    setShowComponentsPreview,
    t,
    generateComponentsPreview,
    decisionSelections,
    handleDecisionToggle,
    decisionLang
  };

  const ConfigPanelProps = {
    t,
    selectedNode,
    editable,
    permissions,
    updateNodeData,
    nodeTypes,
    GRID_SIZE,
    snapToGrid,
    nodes,
    setNodes,
    setSelectedNode,
    caseStatusOptions,
    requestStatusOptions,
    formOptions,
    groupOptions,
    userOptions,
    connections,
    workflowMetadata,
    workflowStatuses
  };

  const ConnectionLayerProps = {
    connections,
    getNodePosition,
    getNodeConnectionPoint,
    isConnecting,
    tempConnection,
    connectingFrom
  };

  const ImportModalProps = {
    showImportDialog,
    editable,
    permissions,
    setShowImportDialog,
    t,
    handleFileImport,
    importJsonText,
    setImportJsonText,
    importJsonWorkflow
  };

  const JsonPreviewModalProps = {
    showJsonPreview,
    editable,
    permissions,
    setShowJsonPreview,
    loading,
    workflowMetadata,
    nodes,
    connections,
    t,
    copiedJson,
    copyJsonToClipboard,
    downloadJsonWorkflow,
    validationErrors,
    saveWorkflow
  };

  const NodeRendererProps = {
    nodes,
    nodeTypes,
    selectedNode,
    editable,
    permissions,
    isDragging,
    handleNodeMouseDown,
    deleteNode
  };

  const ToolbarProps = {
    workflowMetadata,
    updateWorkflowMetadata,
    workflowStatuses,
    workflowStatusesOptions,
    editable,
    permissions,
    nodeTypes,
    handleDragStart,
    addNode,
    setShowImportDialog,
    setShowComponentsPreview,
    handleSaveClick,
    workflowId,
    workflowAction,
    t,
    language
  };

  return (
    <>
      <div className="xl:flex bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-700">
        {/* Hidden file input */}
        <input
          type="file"
          accept=".json"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileImport}
        />

        {/* Toolbar */}
        <Toolbar {...ToolbarProps} />

        {/* Canvas */}
        <Canvas 
          {...CanvasProps} 
          ConnectionLayerProps={ConnectionLayerProps} 
          NodeRendererProps={NodeRendererProps} 
        />

        {/* Configuration Panel */}
        <ConfigPanel {...ConfigPanelProps} />

        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* JSON Preview Dialog */}
        <JsonPreviewModal {...JsonPreviewModalProps} />
        
        {/* Import Dialog */}
        <ImportModal {...ImportModalProps} />

        {/* Components Preview Dialog */}
        <ComponentsPreviewModal {...ComponentsPreviewModalProps} />
      </div>
    </>
  );
};

export default WorkflowEditorComponent;
