// src/cms/components/crm/request/inventoryRequestList.tsx
import React, { useState, useMemo, useCallback } from 'react';
import Badge from '@/core/components/ui/badge/Badge';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { useTranslation } from '@/core/hooks/useTranslation';

import { formatDateTime } from '@/cms/utils/productHelper';
import { Order } from '@/cms/types/order';

interface InventoryRequestListProps {
    data: Order[];
    onDelete?: (item: Order) => void;
    onView?: (item: Order) => void;
}

type SortKey = keyof Order;
type SortDir = 'asc' | 'desc';

interface SortConfig { key: SortKey | null; direction: SortDir; }

// --- Sort header button ---
const SortButton = React.memo<{
    label: string;
    sortKey: SortKey;
    sortConfig: SortConfig;
    onSort: (key: SortKey) => void;
}>(({ label, sortKey, sortConfig, onSort }) => {
    const isActive = sortConfig.key === sortKey;
    const icon = isActive
        ? sortConfig.direction === 'asc'
            ? <ChevronUpIcon className="w-4 h-4" />
            : <ChevronDownIcon className="w-4 h-4" />
        : null;

    return (
        <div
            onClick={() => onSort(sortKey)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap cursor-pointer"
        >
            {label}
            <span className="flex flex-col">{icon}</span>
        </div>
    );
});
SortButton.displayName = 'SortButton';

// --- Main list component ---
const InventoryRequestList: React.FC<InventoryRequestListProps> = ({ data, onView }) => {
    const { t ,language} = useTranslation();
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
    const handleSort = useCallback((key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    }, []);

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key!] ?? '';
            const bVal = b[sortConfig.key!] ?? '';
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const sortBtn = (label: string, key: SortKey) =>
        <SortButton label={label} sortKey={key} sortConfig={sortConfig} onSort={handleSort} />;

    const headerCell = (content: React.ReactNode, align = 'text-left') =>
        <th className={`px-6 py-4 ${align}`}>{content}</th>;

    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full table-auto" >
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            {headerCell(sortBtn(t('common.order'), 'orderId'))}
                            {headerCell(sortBtn(t('common.detail'), 'title'))}
                            {headerCell(<span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.bill_to')}</span>)}
                            {headerCell(<span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.ship_to')}</span>)}
                            {headerCell(sortBtn(t('common.totalItems'), 'totalItems'), 'text-center justify-items-center')}
                            {/* {headerCell(sortBtn(t('common.totalQty'), 'totalQty'), 'text-center justify-items-center')} */}
                            {headerCell(<span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.status')}</span>, 'text-center justify-items-center')}
                            {headerCell(sortBtn(t('common.createdAt'), 'createdAt'), 'text-center justify-items-center')}
                            {headerCell(sortBtn(t('common.requestBy'), 'requestBy'))}
                            {/* {headerCell(null, 'text-right')} */}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                        {sortedData.map(item => (
                            <tr onClick={() => onView?.(item)} key={item.orderId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors hover:cursor-pointer">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{item.orderId}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm">{item.title || '-'}</span>
                                </td>
                                
                                <td className="px-6 py-4">
                                    <span className="text-sm">{ item.billTo || '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm">{item.shipTo || '-'}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-bold text-gray-900 dark:text-white">{item.totalItems}</span>
                                </td>
                                {/* <td className="px-6 py-4 text-center">{item.totalQty}</td> */}
                                <td className="px-6 py-4 text-center">
                                    <Badge color={"success"} className="py-0 px-2" size="sm">
                                        {item.orderStatusMeta?.[language as "th" | "en"] ?? '-'}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-center text-xs text-gray-500">
                                    {formatDateTime(item.createdAt)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item?.requestBy || '-'}</span>
                                </td>
                                {/* <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button onClick={() => onView?.(item)} variant="outline" size="sm">
                                            <Eye size={18} />
                                        </Button>
                                        <Button onClick={() => onDelete?.(item)} variant="outline" size="sm">
                                            {t('common.delete')}
                                        </Button>
                                    </div>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryRequestList;
