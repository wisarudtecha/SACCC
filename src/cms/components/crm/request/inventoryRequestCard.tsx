// src/cms/components/crm/request/inventoryRequestCard.tsx
import React from 'react';
import Badge from '@/core/components/ui/badge/Badge';
import { User, Truck, Box, Clock } from 'lucide-react';
import { useTranslation } from '@/core/hooks/useTranslation';
import { formatDateTime } from '@/cms/utils/productHelper';
import { Order } from '@/cms/types/order';

interface InventoryRequestCardProps {
    item: Order;
    onDelete?: (item: Order) => void;
    onView?: (item: Order) => void;
}

const InventoryRequestCard: React.FC<InventoryRequestCardProps> = ({ item, onView }) => {
    const { t ,language} = useTranslation();

    return (
        <div onClick={() => onView?.(item)} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700 flex flex-col hover:cursor-pointer">
            {/* Header: Order ID + Status */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-1">{item.orderId}</p>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-relaxed">
                        {item.title || item.billTo || '-'}
                    </h3>
                </div>
                <Badge color={"success"} className="py-0 px-2 ml-2 mt-1 shrink-0" size="sm">
                    {item.orderStatusMeta?.[language as "th" | "en"] ?? '-'}
                </Badge>
            </div>

            {/* Detail rows */}
            <div className="text-gray-600 dark:text-gray-300 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{item?.requestBy || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Truck className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>{item.shipTo || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Box className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>{item.totalItems} {t('common.totalItems')} · {item.totalQty} {t('common.totalQty')}</span>
                </div>
                {item.title && <div className="flex items-center gap-2 text-sm">
                    <span>{item.title}</span>
                </div>}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDateTime(item.createdAt)}</span>
                </div>
            </div>

            {/* Actions */}
            {/* <div className="mt-auto pt-4 flex justify-end gap-2">
                <Button onClick={() => onView?.(item)} variant="outline" size="sm">
                    <Eye size={18} />
                </Button>
            </div> */}
        </div>
    );
};

export default InventoryRequestCard;
