// /src/utils/workflowSort.ts
import type { TimelineStep } from "@/cms/types/case";
import type { Connection } from "@/cms/types/workflow";
import { SOP_TIMELINES_STATUS } from "@/cms/utils/constants";

export interface WorkflowNode {
  nodeId: string;
  type: string;
  section: string;
  data: {
    data?: {
      label?: string;
      config?: {
        action?: string;
        [key: string]: unknown;
      };
    };
    position?: {
      x: number;
      y: number;
    };
    [key: string]: unknown;
  };
}

/**
 * Sort workflow nodes by following connections from start node
 * This handles complex workflows with branches, loops, and non-linear positioning
 */
export const sortWorkflowByConnections = (
  nodes: WorkflowNode[],
  connections: Connection[]
): WorkflowNode[] => {
  if (!nodes || nodes.length === 0) return [];

  // Build adjacency map for quick lookup
  const adjacencyMap = new Map<string, Connection[]>();
  connections.forEach(conn => {
    if (!adjacencyMap.has(conn.source)) {
      adjacencyMap.set(conn.source, []);
    }
    adjacencyMap.get(conn.source)!.push(conn);
  });

  // Find start node
  // const startNode = nodes?.find(n => n.type === "start") || null;
  const startNode = nodes?.find(n => n.type === "process" || n.type === "dispatch") || null;
  if (!startNode) {
    // console.warn("No start node found, falling back to position sort");
    return sortByPosition(nodes);
  }

  const sorted: WorkflowNode[] = [];
  const visited = new Set<string>();
  const processing = new Set<string>(); // For cycle detection

  /**
   * DFS traversal with cycle detection
   * Prioritizes "yes" or unlabeled connections over "no" connections
   */
  const dfs = (nodeId: string, depth: number = 0): void => {
    // Prevent infinite loops
    if (depth > nodes.length * 2) return;
    
    // Skip if already visited
    if (visited.has(nodeId)) return;
    
    // Detect cycles (node being processed in current path)
    if (processing.has(nodeId)) return;

    processing.add(nodeId);

    const currentNode = nodes?.find(n => n.nodeId === nodeId) || null;
    if (currentNode && !visited.has(nodeId)) {
      sorted.push(currentNode);
      visited.add(nodeId);
    }

    // Get outgoing connections
    const outgoingConnections = adjacencyMap.get(nodeId) || [];

    // Sort connections: prioritize "yes" or empty labels over "no"
    const sortedConnections = [...outgoingConnections].sort((a, b) => {
      const labelA = (a.label || "").toLowerCase();
      const labelB = (b.label || "").toLowerCase();

      // Priority: yes/empty > no
      if (labelA === "yes" || labelA === "") return -1;
      if (labelB === "yes" || labelB === "") return 1;
      if (labelA === "no") return 1;
      if (labelB === "no") return -1;
      
      return 0;
    });

    // Follow connections
    sortedConnections.forEach(conn => {
      dfs(conn.target, depth + 1);
    });

    processing.delete(nodeId);
  };

  // Start DFS from start node
  dfs(startNode.nodeId);

  // Add any unvisited nodes (disconnected components)
  nodes.forEach(node => {
    if (!visited.has(node.nodeId)) {
      sorted.push(node);
    }
  });

  return sorted;
};

/**
 * Enhanced SOP sorting that filters and orders nodes
 */
export const sortSOPNodes = (
  sopNodes: WorkflowNode[],
  connections: Connection[]
): WorkflowNode[] => {
  // Identify nodes on "no" paths that should be excluded from main timeline
  const delayNodeIds = new Set<string>();
  
  // Find decision nodes and their "no" branches
  const decisionNodes = sopNodes.filter(n => n.type === "decision");
  
  decisionNodes.forEach(decisionNode => {
    const noConnections = connections.filter(
      conn => conn.source === decisionNode.nodeId && 
              conn.label?.toLowerCase() === "no"
    );
    
    noConnections.forEach(conn => {
      // Mark this node as a delay node
      const targetNode = sopNodes?.find(n => n.nodeId === conn.target) || null;
      if (targetNode && targetNode.data?.data?.label?.toLowerCase().includes("delay")) {
        delayNodeIds.add(conn.target);
      }
    });
  });

  // Filter out delay nodes and non-process nodes
  const processNodes = sopNodes.filter(
    node =>
      (node.type === "process" || node.type === "dispatch")
      // && !delayNodeIds.has(node.nodeId)
      && !SOP_TIMELINES_STATUS.includes(node.data?.data?.config?.action as typeof SOP_TIMELINES_STATUS[number])
  );

  // Sort by following connections
  return sortWorkflowByConnections(processNodes, connections);
};

/**
 * Get the main path through the workflow (following "yes" branches)
 */
export const getMainWorkflowPath = (
  nodes: WorkflowNode[],
  connections: Connection[]
): WorkflowNode[] => {
  const startNode = nodes?.find(n => n.type === "start") || null;
  if (!startNode) return [];

  const mainPath: WorkflowNode[] = [];
  const visited = new Set<string>();
  let currentNodeId: string | undefined = startNode.nodeId;

  while (currentNodeId && !visited.has(currentNodeId)) {
    visited.add(currentNodeId);
    
    const currentNode = nodes?.find(n => n.nodeId === currentNodeId) || null;
    if (currentNode) {
      mainPath.push(currentNode);
    }

    // Find next node (prioritize "yes" or unlabeled connections)
    const nextConnection = connections?.find(
      conn =>
        conn.source === currentNodeId &&
        (conn.label?.toLowerCase() === "yes" || !conn.label || conn.label === "")
    ) || null;

    currentNodeId = nextConnection?.target;

    // If no "yes" connection found, try any connection
    if (!currentNodeId) {
      const anyConnection = connections?.find(conn => conn.source === currentNode?.nodeId) || null;
      currentNodeId = anyConnection?.target;
    }
  }

  return mainPath;
};

/**
 * Fallback: Sort by position (Y-axis primary, X-axis secondary)
 */
export const sortByPosition = (nodes: WorkflowNode[]): WorkflowNode[] => {
  return [...nodes].sort((a, b) => {
    const posA = a.data?.position;
    const posB = b.data?.position;
    
    if (!posA || !posB) return 0;
    
    const yDiff = posA.y - posB.y;
    if (yDiff !== 0) return yDiff;
    
    return posA.x - posB.x;
  });
};

/**
 * Sort timeline steps (backward compatible)
 */
export const sortWorkflow = (timelineSteps: TimelineStep[]): TimelineStep[] => {
  if (!timelineSteps || timelineSteps.length === 0) return [];

  // If steps have SOP data, use connection-based sorting
  if (timelineSteps[0]?.sop) {
    // This would require restructuring - for now, sort by action ID
    return sortByActionId(timelineSteps);
  }

  return sortByActionId(timelineSteps);
};

/**
 * Sort by action ID (S001, S002, etc.)
 */
const sortByActionId = (timelineSteps: TimelineStep[]): TimelineStep[] => {
  return [...timelineSteps].sort((a, b) => {
    const actionIdA = (a.metadata?.actionId as string) || "";
    const actionIdB = (b.metadata?.actionId as string) || "";
    
    const numA = parseInt(actionIdA.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(actionIdB.replace(/\D/g, ""), 10) || 0;
    
    return numA - numB;
  });
};
