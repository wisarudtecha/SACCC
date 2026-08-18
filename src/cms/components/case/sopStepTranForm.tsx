import { CaseSop } from "@/cms/types/dispatch";
import { CaseStatusInterface, delayStatus } from "../ui/status/status";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { OrderHistory } from "@/cms/types/order";

export interface ProgressSteps {
    id: string;
    title: string;
    completed: boolean;
    current?: boolean;
    nextStage?: boolean;
    type?: string;
    description?: string;
    remark?: string | null;
    sla?: number;
    timeline?: {
        completedAt?: string;
        duration?: number;
        userOwner?: string;
    };
    pic?: string[];
    statusId?: string;
}

export interface ProgressStepPreviewProps {
    progressSteps: ProgressSteps[];
    sliceIndex?: boolean;
}
interface ProgressLane {
    id: string;
    name: string;
    steps: ProgressSteps[];
    isActive: boolean;
}

const isDelayNode = (node: any): boolean => {
    const status = node.data?.data?.config?.action || '';
    return delayStatus.includes(status);
};

export const mapSopToSimpleProgress = (sopData: CaseSop): ProgressSteps[] => {
    if (!sopData?.sop || !sopData?.currentStage) {
        return [];
    }

    const allNodes = sopData.sop.filter(item => item.section === "nodes");

    const displayNodes = allNodes
        .filter(item =>
            (item.type === "process" || item.type === "dispatch") &&
            !isDelayNode(item)
        )
        .sort((a, b) => {
            const aY = a.data?.position?.y || 0;
            const bY = b.data?.position?.y || 0;
            return aY - bY;
        });

    let effectiveCurrentNodeId = sopData.currentStage.nodeId;
    const currentNode = allNodes.find(item => item.nodeId === sopData.currentStage.nodeId);

    if (currentNode && (isDelayNode(currentNode) || currentNode.type === "decision")) {
        const connections = sopData.sop.find(item => item.section === "connections")?.data || [];
        const nextConnections = connections.filter((conn: any) => conn.source === sopData.currentStage.nodeId);

        for (const conn of nextConnections) {
            const nextNode = displayNodes.find(n => n.nodeId === conn.target);
            if (nextNode) {
                effectiveCurrentNodeId = conn.target;
                break;
            }
        }
    }

    let foundCurrent = false;

    return displayNodes.map((node, index) => {
        const isCompleted = !foundCurrent && node.nodeId !== effectiveCurrentNodeId;
        const isCurrent = node.nodeId === effectiveCurrentNodeId;

        if (isCurrent) {
            foundCurrent = true;
        }

        return {
            id: (index + 1).toString(),
            title: node.data?.data?.label || `Step ${index + 1}`,
            completed: isCompleted,
            current: isCurrent,
            type: node.type,
            description: node.data?.data?.description
        };
    });
};

export const mapSopToOrderedProgress = (sopData: CaseSop, language: string): ProgressSteps[] => {
    if (!sopData?.sop || !sopData?.currentStage) {
        return [];
    }
    const caseStatus = JSON.parse(localStorage.getItem("caseStatus") ?? "[]") as CaseStatusInterface[];
    const slaTimelines = sopData.slaTimelines || [];

    const connections = sopData.sop.find(item => item.section === "connections")?.data || [];
    const allNodes = sopData.sop.filter(item => item.section === "nodes");

    const workflowNodes = allNodes.filter(item =>
        (item.type === "process" || item.type === "dispatch") &&
        !isDelayNode(item)
    );

    const buildExecutionOrder = (): string[] => {
        const visited = new Set<string>();
        const executionOrder: string[] = [];

        const startNode = allNodes.find(item => item.type === "start");
        if (!startNode) {
            return workflowNodes
                .sort((a, b) => (a.data?.position?.y || 0) - (b.data?.position?.y || 0))
                .map(node => node.nodeId);
        }

        const traverse = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const workflowNode = workflowNodes.find(n => n.nodeId === nodeId);
            if (workflowNode) {
                executionOrder.push(nodeId);
            }

            const outgoingConnections = connections.filter((conn: any) => conn.source === nodeId);

            outgoingConnections.sort((a: any, b: any) => {
                if (a.label && b.label) {
                    if (a.label.toLowerCase() === "yes") return -1;
                    if (b.label.toLowerCase() === "yes") return 1;
                }
                return 0;
            });

            outgoingConnections.forEach((conn: any) => {
                traverse(conn.target);
            });
        };

        traverse(startNode.nodeId);

        return executionOrder;
    };

    const orderedNodeIds = buildExecutionOrder();

    let effectiveCurrentNodeId = sopData.currentStage.nodeId;
    const currentNode = allNodes.find(item => item.nodeId === sopData.currentStage.nodeId);

    if (currentNode && (isDelayNode(currentNode) || currentNode.type === "decision")) {
        const nextConnections = connections.filter((conn: any) => conn.source === sopData.currentStage.nodeId);

        for (const conn of nextConnections) {
            const nextNode = workflowNodes.find(n => n.nodeId === conn.target);
            if (nextNode) {
                effectiveCurrentNodeId = conn.target;
                break;
            }
        }
    }

    const currentIndex = orderedNodeIds.indexOf(effectiveCurrentNodeId);

    return orderedNodeIds.map((nodeId, index) => {
        const node = workflowNodes.find(n => n.nodeId === nodeId);
        if (!node) return null;

        const isCompleted = currentIndex !== -1 && index < currentIndex;
        const isCurrent = index === currentIndex;
        const isNext = currentIndex !== -1 && index === currentIndex + 1;

        const statusId = node.data?.data?.config?.action;

        const latestTimelineData = slaTimelines
            .filter(timeline => timeline.statusId === statusId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        const slaValue = node.data?.data?.config?.sla;
        const sla = slaValue ? parseInt(slaValue, 10) : undefined;

        const title = language === "th"
            ? caseStatus.find((item) => statusId === item.statusId)?.th ||
            node.data?.data?.label ||
            `Step ${index + 1}`
            : caseStatus.find((item) => statusId === item.statusId)?.en ||
            node.data?.data?.label ||
            `Step ${index + 1}`;

        return {
            id: (index + 1).toString(),
            title,
            completed: isCompleted,
            current: isCurrent,
            nextStage: isNext,
            type: node.type,
            description: node.data?.data?.description,
            sla: sla,
            timeline: latestTimelineData ? {
                completedAt: new Date(latestTimelineData?.createdAt).getTime(),
                duration: latestTimelineData.duration,
                userOwner: latestTimelineData.userOwner
            } : undefined
        };
    }).filter(Boolean) as ProgressSteps[];
};

export const mapSopToProgressStepsWithBranching = (sopData: CaseSop, language: string): ProgressSteps[] => {
    return mapSopToOrderedProgress(sopData, language);
};


export interface OrderWorkflowNode {
    id: string;
    type: string;
    data: {
        label: string;
        config: {
            action: string;
            group: string[] | null;
            pic: string[] | null;
            sla: string;
        };
    };
}

export interface OrderWorkflowConnection {
    source: string;
    target: string;
    label: string;
}

export interface OrderWorkflowData {
    nodes: OrderWorkflowNode[];
    connections: OrderWorkflowConnection[];
}

export const mapHistoryToOrderedProgress = (
    workflowData: OrderWorkflowData,
    history: OrderHistory[],
    currentStatusId: string,
): ProgressSteps[] => {
    if (!workflowData?.nodes || !workflowData?.connections) return [];

    const { nodes, connections } = workflowData;

    const cancelEntry = history.find(h => h.hAction === 'CANCEL');
    const isCancelled = !!cancelEntry;

    const buildExecutionOrder = (): string[] => {
        const visited = new Set<string>();
        const order: string[] = [];

        const startNode = nodes.find(n => n.type === 'start');
        if (!startNode) {
            return nodes
                .filter(n => n.type === 'process')
                .map(n => n.id);
        }

        const traverse = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const node = nodes.find(n => n.id === nodeId);
            if (node && node.type === 'process') {
                order.push(nodeId);
            }

            const outgoing = connections
                .filter(c => c.source === nodeId)
                .sort((a, b) => {
                    // Prefer "yes" branch first so the happy-path comes first
                    if (a.label?.toLowerCase() === 'yes') return -1;
                    if (b.label?.toLowerCase() === 'yes') return 1;
                    return 0;
                });

            outgoing.forEach(c => traverse(c.target));
        };

        traverse(startNode.id);
        return order;
    };

    const orderedNodeIds = buildExecutionOrder();

    const visitedStatusIds = new Set(history.map(h => h.statusId));

    let currentIndex = -1;
    if (!isCancelled) {
        currentIndex = orderedNodeIds.findIndex(nodeId => {
            const node = nodes.find(n => n.id === nodeId);
            return node?.data?.config?.action === currentStatusId;
        });
    }

    const displayNodeIds = isCancelled
        ? orderedNodeIds.filter(nodeId => {
            const node = nodes.find(n => n.id === nodeId);
            return node ? visitedStatusIds.has(node.data?.config?.action) : false;
        })
        : orderedNodeIds;

    const steps: ProgressSteps[] = displayNodeIds.map((nodeId, index) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;

        const action = node.data?.config?.action;

        let isCompleted: boolean;
        let isCurrent: boolean;
        let isNext: boolean;

        if (isCancelled) {
            isCompleted = visitedStatusIds.has(action);
            isCurrent = false;
            isNext = false;
        } else {
            isCompleted = currentIndex !== -1 && index < currentIndex;
            isCurrent = index === currentIndex;
            isNext = currentIndex !== -1 && index === currentIndex + 1;
        }

        // Find the matching history entry for this action
        const historyEntry = history
            .filter(h => h.statusId === action && (h.hAction?.toUpperCase() === 'EVENT' || h.hAction?.toUpperCase() === 'CREATE'))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        const slaRaw = node.data?.config?.sla;
        const sla = slaRaw ? parseInt(slaRaw, 10) : undefined;

        const title = node.data?.label || `Step ${index + 1}`;

        return {
            id: (index + 1).toString(),
            title,
            completed: isCompleted,
            current: isCurrent,
            nextStage: isNext,
            type: node.type,
            sla,
            timeline: historyEntry
                ? {
                    completedAt: historyEntry.createdAt,
                    userOwner: historyEntry.createdBy,
                }
                : undefined,
            pic: node.data.config.pic,
            statusId: action
        } as ProgressSteps;
    }).filter(Boolean) as ProgressSteps[];

    // Insert the cancel step directly after the last visited step
    if (isCancelled && cancelEntry) {
        steps.push({
            id: 'cancelled',
            title: 'ยกเลิกคำขอ',
            completed: false,
            current: true,
            type: 'cancelled',
            remark: cancelEntry.remark,
            timeline: {
                completedAt: cancelEntry.createdAt,
                userOwner: cancelEntry.createdBy,
            },
        });
    }

    return steps;
};

export const buildProgressLanes = (sopData: CaseSop, language: string): ProgressLane[] => {
    return [{
        id: "main",
        name: "Main Flow",
        steps: mapSopToOrderedProgress(sopData, language),
        isActive: true
    }];
};

export const getTimeDifference = (fromStep: ProgressSteps, toStep: ProgressSteps): string => {
    if (!fromStep?.timeline?.completedAt || !toStep?.timeline?.completedAt) {
        return '';
    }
    const fromTime = new Date(fromStep.timeline.completedAt).getTime();
    const toTime = new Date(toStep.timeline.completedAt).getTime();
    const diffMs = toTime - fromTime;

    if (diffMs <= 0) return '';
    const { t } = useTranslation();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const years = diffYears;
    const months = diffMonths % 12;
    const days = diffDays % 30;
    const hours = diffHours % 24;
    const minutes = diffMinutes % 60;
    const seconds = diffSeconds % 60;

    const timeUnits = [];

    if (years > 0) timeUnits.push(`${years}${t("time.y")}`);
    if (months > 0) timeUnits.push(`${months}${t("time.m")}`);
    if (days > 0) timeUnits.push(`${days}${t("time.d")}`);
    if (hours > 0) timeUnits.push(`${hours}${t("time.h")}`);
    if (minutes > 0) timeUnits.push(`${minutes}${t("time.m")}`);
    if (seconds > 0) timeUnits.push(`${seconds}${t("time.s")}`);

    return timeUnits.slice(0, 2).join(' ') || `0${t("time.s")}`;
};

export const isSlaViolated = (step: ProgressSteps): boolean => {
    if (!step.sla || !step.timeline?.duration) {
        return false;
    }

    const slaInSeconds = step.sla * 60;
    return step.timeline.duration > slaInSeconds;
};
