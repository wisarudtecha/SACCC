// src/cms/components/crm/request/inventoryViewRequest.tsx
import React, { useState, useRef } from 'react';
import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDate } from "@/core/utils/crud";
import { formatDateTime } from "@/cms/utils/productHelper";
import { Clock, User, Package, CheckCircle2, Circle, GitBranch, XCircle, Printer, Minus, Plus, X, Pencil, ReceiptText, Truck, MessageSquare, ChevronDown, ChevronUp, Maximize2 } from "lucide-react";
import { OrderComments } from './OrderComment';
import { OrderCommentModal } from './OrderCommentModal';
import { mapHistoryToOrderedProgress, type ProgressSteps } from "@/cms/components/case/sopStepTranForm";
import { TimeBadge } from "@/cms/components/Sla/Sla";
import { CompactCountdownTimer } from '@/cms/components/countDownSla/countDownSla';
import { useFormatDuration } from '@/cms/components/Sla/formatSlaDuration';
import Button from '@/core/components/ui/button/Button';
import Badge from '@/core/components/ui/badge/Badge';
import {
    useGetOrderDataQuery,
    useControlOrderMutation,
    useCancelOrderMutation,
    useUpdateOrderInfoMutation,
} from '@/cms/store/api/order';
import { useDeleteOrderItemByRequestMutationMutation, useUpdateOrderItemByRequestMutationMutation } from '@/cms/store/api/orderItem';
import type { OrderItem, Order, OrderHistory } from '@/cms/types/order';
import Input from '@/core/components/form/input/InputField';
import { REQUEST_PART_CANCEL, SHIPPING_COMPANIES } from '@/cms/utils/constants';
import OnBackOnly from '@/cms/components/ui/pagesTemplate/onBackOnly';
import { TranslationParams } from '@/core/types/i18n';
import { useToastContext } from '@/core/components/crud/ToastGlobal';
import { TrashBinIcon } from '@/core/icons';
import { SearchableSelect } from '@/cms/components/SearchInput/SearchSelectInput';
import { usePermissions } from '@/core/hooks/usePermissions';
import { ORDER_STATUS_ALLOW_TO_CANCEL } from "@/cms/utils/constants";

interface InventoryViewRequestProps {
    onClose: () => void;
    onEdit?: () => void;
    item: Order | null;
}

interface AddressForm {
    billTo: string;
    billAddr: string;
    shipTo: string;
    shipAddr: string;
    shipBy: string;
}

// interface AddItemForm {
//     type: 'part' | 'product';
//     partId: string;
//     productId: string;
//     quantity: number;
// }

// --- Order item row ---
const OrderItemRow: React.FC<{
    oi: OrderItem;
    language: "en" | "th";
    t: (key: string, params?: TranslationParams | undefined) => string;
    edit: boolean;
    orderId: string;
}> = ({ oi, language, t, edit, orderId }) => {
    const [qty, setQty] = useState<number>(oi.quantity);
    const [updateOrderItem, { isLoading: isSaving }] = useUpdateOrderItemByRequestMutationMutation();
    const [deleteOrderItem, { isLoading: isDel }] = useDeleteOrderItemByRequestMutationMutation();
    const permissions = usePermissions();
    const clamp = (v: number) => Math.max(1, v);

    const commitUpdate = async (newQty: number) => {
        const clamped = clamp(newQty);
        setQty(clamped);
        await updateOrderItem({
            orderId,
            requestId: oi.requestId,
            quantity: clamped,
            productId: oi.productId,
            partId: oi.partId ? oi.partId : undefined,
        });
    };

    const commitDel = async () => {
        await deleteOrderItem({
            orderId,
            requestId: oi.requestId,
        });
    };

    const displayName = oi.partMeta ? oi.partMeta[language] : oi.productMeta[language];
    const unitPrice = oi.partMeta ? oi.partMeta.price : oi.productMeta.price;

    return (
        <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className='flex items-center justify-between'>
                <div className="flex flex-col gap-1">
                    <div className='flex space-x-2'>
                        <span className="text-md font-mono text-gray-400">{displayName}</span>{edit && permissions.hasPermission("order.delete") && <button
                            onClick={commitDel}
                            disabled={isDel}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors shrink-0"
                            title={t('common.remove_from_cart')}
                        >
                            <TrashBinIcon className="w-4 h-4" />
                        </button>}
                    </div>
                    {edit && permissions.hasPermission("order.update") ? (
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-gray-500 uppercase">{t('common.quantity')}</span>
                            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                                <button
                                    onClick={() => commitUpdate(qty - 1)}
                                    disabled={isSaving}
                                    className="px-2.5 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-40"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    value={qty}
                                    onChange={e => setQty(Number(e.target.value))}
                                    onBlur={e => commitUpdate(Number(e.target.value))}
                                    disabled={isSaving}
                                    className="w-12 text-center text-sm font-bold bg-transparent border-x border-gray-200 dark:border-gray-700 dark:text-white focus:outline-none py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    onClick={() => commitUpdate(qty + 1)}
                                    disabled={isSaving}
                                    className="px-2.5 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-40"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t("common.quantity")} {qty} {t("common.item")}
                        </span>
                    )}
                </div>
                <Badge color={oi.isEnoughStock ? 'success' : 'error'} size="sm">
                    {oi.isEnoughStock ? `In Stock` : 'Out of Stock'}
                </Badge>
            </div>
            <div className='text-end mt-1'>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("common.price")} {unitPrice * qty} {t("common.baht")}
                </span>
            </div>
        </div>
    );
};

// --- Workflow progress step item ---
const WorkflowStepItem: React.FC<{
    step: ProgressSteps;
    previousStep?: ProgressSteps;
    nextStep?: ProgressSteps;
    isLast: boolean;
    t: (key: string, params?: TranslationParams | undefined) => string;
    history: OrderHistory[];
}> = ({ step, nextStep, isLast, t, history }) => {
    const [showAllPics, setShowAllPics] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const formatDuration = useFormatDuration();
    const completed = step.completed;
    const current = step.current;
    const next = step.nextStage;
    const isCancelled = step.type === 'cancelled';
    const hasPic = !step.timeline?.completedAt && step.pic && step.pic.length > 0;

    const calculateSlaPerformance = (step: ProgressSteps) => {
        const targetSla = nextStep?.sla;
        if (targetSla === undefined || targetSla === null || !step.timeline?.completedAt || !history || history.length === 0) {
            return null;
        }

        const eventHistory = history.filter(h => h.hAction?.toUpperCase() === 'EVENT' || h.hAction?.toUpperCase() === 'CREATE');

        const latestByStatus: Record<string, OrderHistory> = {};
        for (const h of eventHistory) {
            const existing = latestByStatus[h.statusId];
            if (!existing || new Date(h.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
                latestByStatus[h.statusId] = h;
            }
        }
        const slaHistory = Object.values(latestByStatus);

        const currentEntry = step.statusId
            ? slaHistory.find(h => h.statusId === step.statusId)
            : slaHistory.find(h => h.createdAt === step.timeline?.completedAt);

        if (!currentEntry) {
            return null;
        }

        const sortedHistory = [...slaHistory].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const currentIndex = sortedHistory.findIndex(h => h.id === currentEntry.id);

        let endTime = Date.now();
        const nextEntry = currentIndex !== -1 && currentIndex < sortedHistory.length - 1
            ? sortedHistory[currentIndex + 1]
            : null;

        if (step.completed && nextEntry) {
            endTime = new Date(nextEntry.createdAt).getTime();
        } else if (!step.completed && !step.current) {
            return null;
        }

        const startTime = new Date(currentEntry.createdAt).getTime();
        const actualDurationMs = endTime - startTime;
        const actualDurationMinutes = actualDurationMs / (1000 * 60);
        const slaDurationMinutes = targetSla;
        const difference = actualDurationMinutes - slaDurationMinutes;
        const isOverdue = difference > 0;

        return {
            actualDuration: actualDurationMinutes,
            slaDuration: slaDurationMinutes,
            difference: Math.abs(difference),
            isOverdue
        };
    };

    const slaPerformance = calculateSlaPerformance(step);

    const renderTooltipContent = () => {

        if ((completed || current) && slaPerformance) {
            return (
                <div className="space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {step.title}
                    </div>
                    <div className="text-sm">
                        <div className="text-gray-600 dark:text-gray-400">
                            {t("progress.sla") || "SLA"}: {formatDuration(slaPerformance.slaDuration)}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                            {t("progress.actual") || "Actual"}: {formatDuration(slaPerformance.actualDuration)}
                        </div>
                        <div className={`font-medium ${slaPerformance.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {slaPerformance.isOverdue
                                ? `${t("progress.overdue_by") || "Overdue by"}: ${formatDuration(slaPerformance.difference)}`
                                : `${t("progress.faster_by") || "Faster by"}: ${formatDuration(slaPerformance.difference)}`
                            }
                        </div>
                    </div>
                </div>
            );
        } else if (step.sla || step.sla === 0) {
            return (
                <div className="space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {step.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t("progress.sla") || "SLA"}: {formatDuration(nextStep?.sla || 0)}
                    </div>
                    {!completed && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                            {current ? (t("progress.in_progress") || "In Progress") : (t("progress.pending") || "Pending")}
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <div className="space-y-1">
                    <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {step.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t("progress.no_sla") || "No SLA"}
                    </div>
                </div>
            );
        }
    };


    return (
        <div className="flex items-start w-full relative gap-5">
            {/* ── LEFT: PIC badges — fixed width, right-aligned ── */}
            <div className="w-36 min-w-36 max-w-36 shrink-0 flex flex-wrap justify-end gap-1 pt-0.5 pr-2">
                {hasPic && (
                    showAllPics ? (
                        <div>

                            {step.pic!.map((name, i) => (
                                <Badge key={i} size="xs">{name}</Badge>
                            ))}
                            {step.pic!.length > 1 && (
                                <button
                                    onClick={() => setShowAllPics(false)}
                                    className="inline-flex items-center justify-center cursor-pointer select-none"
                                >
                                    <Badge size="xs" color="secondary">
                                        {t('common.hide')}
                                    </Badge>
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <Badge size="xs">{step.pic![0]}</Badge>
                            {step.pic!.length > 1 && (
                                <button
                                    onClick={() => setShowAllPics(true)}
                                    className="inline-flex items-center justify-center cursor-pointer select-none"
                                >
                                    <Badge size="xs" color="secondary">...</Badge>
                                </button>
                            )}
                        </>
                    )
                )}
            </div>

            {/* ── CENTER: icon + connector line — fixed, centered ── */}
            <div className="flex flex-col items-center shrink-0 w-6 self-stretch">
                <div
                    className="relative cursor-pointer z-30"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {isCancelled ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                    ) : completed ? (
                        <CheckCircle2 className={`w-5 h-5 ${slaPerformance?.isOverdue ? 'text-red-500' : 'text-brand-500'}`} />
                    ) : current ? (
                        <div className="relative w-5 h-5">
                            <span className={`absolute inset-0 rounded-full ${slaPerformance?.isOverdue ? 'bg-red-400' : 'bg-brand-400'} opacity-30 animate-ping`} />
                            <span className={`relative flex w-5 h-5 rounded-full ${slaPerformance?.isOverdue ? 'bg-red-500' : 'bg-brand-500'} items-center justify-center`}>
                                <span className="w-2 h-2 rounded-full bg-white" />
                            </span>
                        </div>
                    ) : (
                        <Circle className={`w-5 h-5 ${next ? 'text-gray-400 dark:text-gray-500' : 'text-gray-200 dark:text-gray-700'
                            }`} />
                    )}

                    {isHovered && !isLast && (
                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg whitespace-nowrap text-left text-xs md:text-sm">
                            {renderTooltipContent()}
                        </div>
                    )}
                </div>
                {!isLast && (
                    <div className={`w-px flex-1 mt-1 min-h-9 relative flex items-center justify-center ${isCancelled ? 'bg-red-300 dark:bg-red-800'
                        : completed ? 'bg-brand-400'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                        {/* Countdown Timer for current active step */}
                    </div>
                )}
            </div>

            {/* ── RIGHT: content ── */}
            <div className={`pb w-fit flex flex-col pl-2 ${isCancelled
                ? 'bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800/50 px-2 pb-2 pt-0.5'
                : current
                    ? 'bg-brand-50 dark:bg-brand-900/10 rounded-lg border border-brand-200 dark:border-brand-800/50 px-2 pb-2 pt-0.5'
                    : ''
                }`}>
                <div className="flex flex-wrap items-center gap-1.5">
                    <p className={`text-sm font-semibold ${isCancelled ? 'text-red-600 dark:text-red-400'
                        : completed ? 'text-gray-700 dark:text-gray-300'
                            : current ? 'text-brand-700 dark:text-brand-300'
                                : 'text-gray-400 dark:text-gray-600'
                        }`}>
                        {step.title}
                    </p>

                    {current && !isCancelled && (
                        <Badge color='medium' size='xs'>
                            ● {t("common.currentStep")}
                        </Badge>
                    )}
                    {current && !isCancelled && nextStep?.sla && step.timeline?.completedAt && !isLast && (
                        <div>
                            <CompactCountdownTimer
                                createdAt={step.timeline.completedAt}
                                sla={nextStep?.sla}
                                size="xs"
                                className="px-1.5 py-0.5 rounded text-xs font-semibold shadow"
                            />
                        </div>
                    )}
                    {/* Time Difference Badge between completed steps */}
                    {completed && !step.current && (
                        <div >
                            <TimeBadge
                                from={step}
                                to={nextStep}
                                violated={!!slaPerformance?.isOverdue}
                            />
                        </div>
                    )}
                </div>

                {isCancelled && step.remark && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 italic wrap-break-words">
                        "{step.remark}"
                    </p>
                )}

                {step.timeline?.completedAt && !step.current && step.completed && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {formatDateTime(step.timeline.completedAt)}
                        {step.timeline.userOwner && ` · ${step.timeline.userOwner}`}
                    </p>
                )}
            </div>
        </div>
    );
};

// --- Workflow progress steps list ---
const WorkflowSteps: React.FC<{
    steps: ProgressSteps[];
    t: (key: string, params?: TranslationParams | undefined) => string;
    history: OrderHistory[];
}> = ({ steps, t, history }) => {

    return (
        <div className="pl-1">
            {steps.map((step, idx) => (
                <WorkflowStepItem
                    key={step.id}
                    step={step}
                    previousStep={idx > 0 ? steps[idx - 1] : undefined}
                    nextStep={idx < steps.length - 1 ? steps[idx + 1] : undefined}
                    isLast={idx === steps.length - 1}
                    t={t}
                    history={history}
                />
            ))}
        </div>
    );
};

// --- Print view modal ---
const PrintViewModal: React.FC<{
    item: Order;
    detail: import('@/cms/types/order').OrderData | undefined;
    language: "en" | "th";
    t: (key: string, params?: TranslationParams | undefined) => string;
    onClose: () => void;
}> = ({ item, detail, language, t, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const items = detail?.items ?? [];

    const billAddr = detail?.billAddr ?? item.billAddr ?? '';
    const billTo = detail?.billTo ?? item.billTo ?? '';
    const shipAddr = detail?.shipAddr ?? item.shipAddr ?? '';
    const shipTo = detail?.shipTo ?? item.shipTo ?? '';
    const shipBy = detail?.shipBy ?? item.shipBy ?? '';

    const handlePrint = () => {
        const el = printRef.current;
        if (!el) return;
        const win = window.open('', '_blank');
        if (!win) return;

        // Write base HTML structure
        win.document.write(`<html><head><title>Order ${item.orderId}</title></head><body class="bg-white text-gray-900 p-6">${el.innerHTML}</body></html>`);

        // Copy all parent stylesheets (style & link elements) to the new window to render matching Tailwind/CSS UI
        Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((styleNode) => {
            win.document.head.appendChild(styleNode.cloneNode(true));
        });

        win.document.close();

        // Timeout ensures stylesheet parser has processed all rules before opening print dialog
        setTimeout(() => {
            win.focus();
            win.print();
            win.close();
        }, 300);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Modal header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Printer className="w-5 h-5 text-brand-500" />
                        {t('common.order')}: <span className="font-mono text-brand-600">{item.orderId}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Printer className="w-4 h-4" /> {t('common.print') ?? 'Print'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>
                {/* Printable content */}
                <div className="overflow-y-auto flex-1 p-5" ref={printRef}>
                    <div className="mb-4">
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold">{t('common.order')}:</span> {item.orderId}
                        </p>
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold">{t('common.createdAt') ?? 'Created'}:</span> {formatDate(item.createdAt)}
                        </p>
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold">{t('common.requestBy') ?? 'Requested by'}:</span> {item?.requestBy}
                        </p>
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold">{t('common.status') ?? 'Status'}:</span> {item.orderStatusMeta?.[language] ?? '-'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="space-y-4">
                            {/* Bill block — only show when same address, otherwise keep separate */}
                            <div>
                                <span className='flex items-center text-gray-900 dark:text-white font-semibold mb-2'>
                                    <ReceiptText className="w-5 h-5 mr-2 text-blue-800 dark:text-blue-400" />
                                    {t("common.bill")}
                                </span>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            {t('common.bill_to')}
                                        </label>
                                        <p className="font-semibold text-gray-900 dark:text-white">{billTo || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            {t('common.bill_addr')}
                                        </label>
                                        <p className="font-semibold text-gray-900 dark:text-white">{billAddr || '-'}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Shipping block */}
                            <div>
                                <span className='flex items-center text-gray-900 dark:text-white font-semibold mb-2'>
                                    <Truck className="w-5 h-5 mr-2 text-blue-800 dark:text-blue-400" />
                                    {t("common.shipping")}
                                </span>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            {t('common.ship_to')}
                                        </label>
                                        <p className="font-semibold text-gray-900 dark:text-white">{shipTo || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            {t('common.ship_addr')}
                                        </label>
                                        <p className="font-semibold text-gray-900 dark:text-white">{shipAddr || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                            {t('common.ship_by')}
                                        </label>
                                        <p className="font-semibold text-gray-900 dark:text-white">{shipBy || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2 mb-3">
                                <Package className="w-4 h-4 text-orange-500" />
                                {t('common.order_items')} ({items.length})
                            </h4>
                            <div className="space-y-2">
                                {items.map(oi => {
                                    const name = oi.partMeta ? oi.partMeta[language] : oi.productMeta[language];
                                    const price = oi.partMeta ? oi.partMeta.price : oi.productMeta.price;
                                    return (
                                        <div key={oi.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{name}</p>
                                                <p className="text-xs text-gray-500">{oi.quantity} {t('common.quantity')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {price * oi.quantity} {t('common.baht')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-3 text-right">
                                <p className="text-base font-bold text-gray-900 dark:text-white">
                                    {t('common.price') ?? 'Total'}:{' '}
                                    {items.reduce((s, oi) => s + (oi.partMeta ? oi.partMeta.price : oi.productMeta.price) * oi.quantity, 0)}{' '}
                                    {t('common.baht')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main modal ---
const InventoryViewRequest: React.FC<InventoryViewRequestProps> = ({ onClose, onEdit, item }) => {
    const { t, language } = useTranslation();
    const permissions = usePermissions();

    // All hooks must be called unconditionally before any early return
    const [wantToCancel, setWantToCancel] = useState<boolean>(false);
    const [cancelRemark, setCancelRemark] = useState<string>('');
    const [printView, setPrintView] = useState<boolean>(false);
    const [showComment, setShowComment] = useState<boolean>(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState<boolean>(false);
    const [editItem, setEditItem] = useState<boolean>(false);
    const [editAddr, setEditAddr] = useState<boolean>(false);
    const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
    const [title, setTitle] = useState<string>(item?.title ?? '');

    React.useEffect(() => {
        if (item?.title) {
            setTitle(item.title);
        }
    }, [item?.title]);

    const [addressForm, setAddressForm] = useState<AddressForm>({
        billTo: item?.billTo ?? '',
        billAddr: item?.billAddr ?? '',
        shipTo: item?.shipTo ?? '',
        shipAddr: item?.shipAddr ?? '',
        shipBy: item?.shipBy ?? '',
    });
    // const [_addItemForm, _setAddItemForm] = useState<AddItemForm>({
    //     type: 'part',
    //     partId: '',
    //     productId: '',
    //     quantity: 1,
    // });
    const { addToast } = useToastContext();
    const { data: orderDetail, isLoading } = useGetOrderDataQuery(item?.orderId ?? '', {
        skip: !item?.orderId,
    });
    const [controlOrder, { isLoading: isControlling }] = useControlOrderMutation();
    const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
    const [updateOrderInfo, { isLoading: isUpdatingAddr }] = useUpdateOrderInfoMutation();

    React.useEffect(() => {
        if (!editAddr) {
            const detail = orderDetail?.data;
            if (detail) {
                setAddressForm({
                    billTo: detail.billTo ?? '',
                    billAddr: detail.billAddr ?? '',
                    shipTo: detail.shipTo ?? '',
                    shipAddr: detail.shipAddr ?? '',
                    shipBy: detail.shipBy ?? '',
                });
            } else if (item) {
                setAddressForm({
                    billTo: item.billTo ?? '',
                    billAddr: item.billAddr ?? '',
                    shipTo: item.shipTo ?? '',
                    shipAddr: item.shipAddr ?? '',
                    shipBy: item.shipBy ?? '',
                });
            }
        }
    }, [orderDetail, item, editAddr]);

    // Early return AFTER all hooks
    if (!item) return null;

    const detail = orderDetail?.data;
    const items = detail?.items ?? [];
    const NextNode = detail?.nextNode && detail?.nextNode?.length !== 0 ? detail?.nextNode : null;
    const actionType = NextNode ? NextNode[0].type : null;

    const currentBillTo = detail?.billTo ?? item.billTo ?? '';
    const currentBillAddr = detail?.billAddr ?? item.billAddr ?? '';
    const currentShipTo = detail?.shipTo ?? item.shipTo ?? '';
    const currentShipAddr = detail?.shipAddr ?? item.shipAddr ?? '';
    const currentShipBy = detail?.shipBy ?? item.shipBy ?? '';


    // --- Handlers ---
    const handleControlOrder = async (action: string, exitPoint?: string) => {
        if (!action) return;
        try {
            await controlOrder({
                orderId: item.orderId,
                exitPoint: exitPoint,
                statusId: action,
            }).unwrap();
        } catch (err) {
            const error = err as { data?: { msg?: string; desc?: string } };
            addToast("error", error?.data?.msg || "Something went wrong");
        }
    };

    const handleCancelOrder = async () => {
        try {
            await cancelOrder({
                orderId: item.orderId,
                remark: cancelRemark.trim(),
            }).unwrap();
            setWantToCancel(false);
            setCancelRemark('');
        } catch (err) {
            const error = err as { data?: { msg?: string; desc?: string } };
            addToast("error", error?.data?.msg || "Something went wrong");
        }
    };

    const handleSaveAddress = async () => {
        try {
            await updateOrderInfo({
                orderId: item.orderId,
                billTo: addressForm.billTo,
                billAddr: addressForm.billAddr,
                shipTo: addressForm.shipTo,
                shipBy: addressForm.shipBy,
                shipAddr: addressForm.shipAddr,
                title: title || item.title || '',
            }).unwrap();
            // refetch()
            addToast("success", t("common.success"));
            setEditAddr(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            addToast("error", err?.data?.msg || err?.data?.message || "Something went wrong");
        }
    };

    const handleSaveTitle = async () => {
        setIsEditingTitle(false);
        if (!title.trim() || title.trim() === item.title) return;
        try {
            await updateOrderInfo({
                orderId: item.orderId,
                title: title.trim(),
                billTo: addressForm.billTo || currentBillTo,
                billAddr: addressForm.billAddr || currentBillAddr,
                shipTo: addressForm.shipTo || currentShipTo,
                shipBy: addressForm.shipBy || currentShipBy,
                shipAddr: addressForm.shipAddr || currentShipAddr,
            }).unwrap();
            addToast("success", t("common.success") || "Title updated successfully");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            addToast("error", err?.data?.msg || err?.data?.message || "Something went wrong");
            setTitle(item.title || '');
        }
    };

    // const handleAddOrderItem = async () => {
    //     if (
    //         (addItemForm.type === 'part' && !addItemForm.partId) ||
    //         (addItemForm.type === 'product' && !addItemForm.productId)
    //     ) {
    //         addToast("error", t("common.required_fields"));
    //         return;
    //     }
    //     if (addItemForm.quantity < 1) {
    //         addToast("error", "Quantity must be at least 1");
    //         return;
    //     }
    //     try {
    //         await addOrderItem({
    //             orderId: item.orderId,
    //             partId: addItemForm.type === 'part' ? addItemForm.partId : undefined,
    //             productId: addItemForm.type === 'product' ? addItemForm.productId : undefined,
    //             quantity: addItemForm.quantity,
    //         }).unwrap();
    //         addToast("success", t("common.created_successfully") || "Item added successfully");
    //         setShowAddItemModal(false);
    //         setAddItemForm({ type: 'part', partId: '', productId: '', quantity: 1 });
    //     } catch (err: any) {
    //         addToast("error", err?.data?.msg || err?.data?.message || "Something went wrong");
    //     }
    // };

    const handleAddPartClick = () => {
        if (onEdit) {
            onEdit();
        }
    };

    return (
        <div>
            <OnBackOnly onBack={onClose}>
                <div className="p-5 overflow-y-auto custom-scrollbar rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
                    {/* Page header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {t('common.order')}: <span className="font-mono text-brand-600">{item.orderId}</span>
                                </h3>
                                <Badge color={"success"} size="sm" className="px-3 py-1">
                                    {orderDetail?.data?.orderStatusMeta?.[language as "th" | "en"] ?? '-'}
                                </Badge>

                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />{formatDate(item.createdAt)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />{item?.requestBy}
                                </span>
                            </div>
                        </div>
                        <div className='flex space-x-3 items-center'>
                            <Button size='xxs' onClick={() => setPrintView(true)}>
                                <Printer className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    {permissions.hasPermission("order.update") && (
                        isEditingTitle ? (
                            <div className="my-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveTitle();
                                        }
                                    }}
                                    autoFocus
                                    className="bg-transparent border-none outline-none p-0 text-xs font-semibold w-64 text-green-800 dark:text-green-400 focus:ring-0 focus:outline-none"
                                />
                            </div>
                        ) : (
                            <span onClick={() => setIsEditingTitle(true)} className="my-3 cursor-pointer inline-block">
                                <Badge
                                    color="success"
                                    size="sm"
                                    className="hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors py-1 px-3 flex items-center gap-1.5"
                                >
                                    <span className="truncate max-w-50">{title || 'No Title'}</span>
                                    <Pencil className="w-3 h-3 text-green-600 dark:text-green-400" />
                                </Badge>
                            </span>
                        )
                    )}
                    {!permissions.hasPermission("order.update") && (
                        <span className="my-3 inline-block">
                            <Badge
                                color="success"
                                size="sm"
                                className="py-1 px-3 flex items-center gap-1.5"
                            >
                                <span className="truncate max-w-50">{title || 'No Title'}</span>
                            </Badge>
                        </span>
                    )}

                    <div className='flex flex-col lg:flex-row gap-6'>
                        {/* ===== LEFT COLUMN ===== */}
                        <div className='flex-1'>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* --- Billing & Shipping --- */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl relative">
                                        {/* Edit / Save address toggle */}
                                        {detail?.editable && permissions.hasPermission("order.update") && <div className="absolute right-3 top-3 flex items-center gap-2">
                                            {editAddr && (
                                                <Button
                                                    size='xxs'
                                                    onClick={handleSaveAddress}
                                                    disabled={isUpdatingAddr}
                                                >
                                                    {isUpdatingAddr ? '...' : t('common.save') ?? 'Save'}
                                                </Button>
                                            )}
                                            <Button
                                                size='xxs'
                                                variant={editAddr ? "warning" : "outline"}
                                                onClick={() => setEditAddr(prev => !prev)}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>}

                                        {editAddr ? (
                                            /* ---- Edit mode ---- */
                                            <div className=" space-y-4">
                                                {/* Bill section */}
                                                <div>
                                                    <span className='flex items-center text-gray-700 dark:text-white font-semibold mb-2'>
                                                        <ReceiptText className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                                                        {t("common.bill")}
                                                    </span>
                                                    <div className='grid grid-cols-2 gap-3'>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.bill_to')}
                                                            </label>
                                                            <Input
                                                                value={addressForm.billTo}
                                                                onChange={e => setAddressForm(f => ({ ...f, billTo: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.bill_addr')}
                                                            </label>
                                                            <Input
                                                                value={addressForm.billAddr}
                                                                onChange={e => setAddressForm(f => ({ ...f, billAddr: e.target.value }))}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Ship section */}
                                                <div>
                                                    <span className='flex items-center text-gray-700 dark:text-white font-semibold mb-2'>
                                                        <Truck className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                                                        {t("common.shipping")}
                                                    </span>
                                                    <div className='grid grid-cols-2 gap-3'>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.ship_to')}
                                                            </label>
                                                            <Input
                                                                value={addressForm.shipTo}
                                                                onChange={e => setAddressForm(f => ({ ...f, shipTo: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.ship_addr')}
                                                            </label>
                                                            <Input
                                                                value={addressForm.shipAddr}
                                                                onChange={e => setAddressForm(f => ({ ...f, shipAddr: e.target.value }))}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.ship_by')}
                                                            </label>
                                                            <SearchableSelect
                                                                options={SHIPPING_COMPANIES}
                                                                value={addressForm.shipBy}
                                                                onChange={val => setAddressForm(f => ({ ...f, shipBy: val }))}
                                                                placeholder={t('common.ship_by_placeholder')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* ---- Read-only mode ---- */
                                            <div className="space-y-4">
                                                {/* Bill block — only show when same address, otherwise keep separate */}

                                                <div>
                                                    <span className='flex items-center text-gray-900 dark:text-white font-semibold mb-2'>
                                                        <ReceiptText className="w-5 h-5 mr-2 text-blue-800 dark:text-blue-400" />
                                                        {t("common.bill")}
                                                    </span>
                                                    <div className='grid grid-cols-2 gap-4'>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.bill_to')}
                                                            </label>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{currentBillTo || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.bill_addr')}
                                                            </label>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{currentBillAddr || '-'}</p>
                                                        </div>

                                                    </div>
                                                </div>


                                                {/* Shipping block */}
                                                <div>
                                                    <span className='flex items-center text-gray-900 dark:text-white font-semibold mb-2'>
                                                        <Truck className="w-5 h-5 mr-2 text-blue-800 dark:text-blue-400" />
                                                        {t("common.shipping")}
                                                    </span>
                                                    <div className='grid grid-cols-2 gap-4'>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.ship_to')}
                                                            </label>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{currentShipTo || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.ship_addr')}
                                                            </label>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{currentShipAddr || '-'}</p>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                                                {t('common.ship_by')}
                                                            </label>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{currentShipBy || '-'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Button size='xxs' variant='outline' onClick={() => setShowComment(prev => !prev)}>
                                                        {showComment ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        <MessageSquare className="w-4 h-4" />
                                                    </Button>
                                                    {/* Comment section */}
                                                    {showComment && (
                                                        <div className="relative mt-4">
                                                            <Maximize2
                                                                className="absolute right-0 m-3 rounded-md opacity-70 hover:cursor-pointer hover:opacity-100 transition-opacity z-10 bg-white dark:bg-gray-900 dark:text-white p-1 shadow-sm"
                                                                onClick={() => setIsCommentModalOpen(true)}
                                                                size={24}
                                                            />
                                                            <OrderComments orderId={item.orderId} isOpen={showComment} />
                                                        </div>
                                                    )}
                                                    <OrderCommentModal
                                                        isOpen={isCommentModalOpen}
                                                        onClose={() => setIsCommentModalOpen(false)}
                                                        orderId={item.orderId}
                                                        orderTitle={title || item.orderId}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* --- Order Items --- */}

                                    <div>
                                        <div className='flex justify-between items-center mb-3'>
                                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                                <Package className="w-4 h-4 text-orange-500" />
                                                {t('common.order_items')} ({items.length})
                                            </h4>
                                            {detail?.editable && permissions.hasPermission("order.update") && (
                                                <Button
                                                    size='xxs'
                                                    variant={editItem ? "warning" : "outline"}
                                                    onClick={() => setEditItem(prev => !prev)}
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                        {editItem && permissions.hasPermission("order.create") && (
                                            <Button onClick={handleAddPartClick} className='w-full mb-3'>
                                                <Plus className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <div className="space-y-2">
                                            {items.map(oi => (
                                                <OrderItemRow
                                                    key={oi.id}
                                                    oi={oi}
                                                    language={language as "th" | "en"}
                                                    t={t}
                                                    edit={editItem}
                                                    orderId={item.orderId}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>

                        {/* ===== RIGHT COLUMN ===== */}
                        <div className='flex-1'>
                            {/* Workflow progress */}
                            {(() => {
                                const wf = detail?.workflow?.data;
                                const wfSteps =
                                    wf?.nodes && wf?.connections && detail?.history
                                        ? mapHistoryToOrderedProgress(
                                            { nodes: wf.nodes, connections: wf.connections },
                                            detail.history,
                                            detail.statusId,
                                        )
                                        : [];
                                if (wfSteps.length === 0) return null;
                                return (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <GitBranch className="w-4 h-4 text-purple-500" />
                                            {t('common.operating_procedure')}
                                        </h4>
                                        <WorkflowSteps steps={wfSteps} t={t} history={detail?.history || []} />
                                    </div>
                                );
                            })()}

                            {/* --- Action buttons --- */}
                            {!isLoading && <div className='block'>
                                {REQUEST_PART_CANCEL !== orderDetail?.data?.statusId && actionType !== "end" && (
                                    <div className='flex space-x-3 justify-between'>
                                        {(detail && ORDER_STATUS_ALLOW_TO_CANCEL.includes(detail.statusId) && permissions.hasPermission("order.cancel")) ? (
                                            <Button
                                                size='xxs'
                                                onClick={() => setWantToCancel(prev => !prev)}
                                                variant={wantToCancel ? 'warning' : 'outline-warning'}
                                            >
                                                {t("common.cancel")}
                                            </Button>
                                        ) : <div></div>}

                                        {actionType !== "decision" ? (
                                            <div className='justify-end'>
                                                {NextNode && permissions.hasPermission("order.complete") && (
                                                    <Button
                                                        size='xxs'
                                                        onClick={() => handleControlOrder(NextNode[0].data.config.action)}
                                                        disabled={isControlling}
                                                    >
                                                        {isControlling ? '...' : NextNode[0].data.label}
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className='justify-end'>
                                                {NextNode && permissions.hasPermission("order.complete") && (
                                                    <div className='space-x-3'>
                                                        <Button
                                                            size='xxs'
                                                            onClick={() => handleControlOrder(NextNode[0].data.config.action, NextNode[0].data.label)}
                                                            disabled={isControlling}
                                                        >
                                                            {isControlling ? '...' : NextNode[0].data.label}
                                                        </Button>
                                                        <Button
                                                            size='xxs'
                                                            onClick={() => handleControlOrder(NextNode[1].data.config.action, NextNode[1].data.label)}
                                                            variant='error'
                                                            disabled={isControlling}
                                                        >
                                                            {isControlling ? '...' : NextNode[1].data.label}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Cancel remark input */}
                                {wantToCancel && permissions.hasPermission("order.cancel") && (
                                    <div className='flex space-x-3 my-3'>
                                        <Input
                                            wrapperClassName='w-full'
                                            className='h-8!'
                                            placeholder={t('common.cancel_reason')}
                                            value={cancelRemark}
                                            onChange={(e) => setCancelRemark(e.target.value)}
                                        />
                                        <Button
                                            size='xxs'
                                            variant='outline'
                                            onClick={handleCancelOrder}
                                            disabled={isCancelling}
                                        >
                                            {isCancelling ? '...' : t("common.cancel")}
                                        </Button>
                                    </div>
                                )}
                            </div>}
                        </div>
                    </div>
                </div>
            </OnBackOnly>

            {/* Print modal */}
            {printView && (
                <PrintViewModal
                    item={item}
                    detail={detail}
                    language={language as "en" | "th"}
                    t={t}
                    onClose={() => setPrintView(false)}
                />
            )}
        </div>
    );
};

export default InventoryViewRequest;