import React, { useState, useMemo, useCallback } from 'react';
import Button from "@/core/components/ui/button/Button";
import Badge from "@/core/components/ui/badge/Badge";
import { i18nUserType } from "./constant";
import { Mail, Phone, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { CustomerProduct } from '@/cms/store/api/custommerApi';
import { useTranslation } from '@/core/hooks/useTranslation';
import { usePiiMasker } from '@/core/hooks/useMaskedValue';
import { ChatIcon } from '@/core/icons';
import { Avatar } from '@/core/components/ui/avatar/Avatarv2';

interface CustomerListViewProps {
    customerData: CustomerProduct[];
    onEdit?: (customer: CustomerProduct) => void;
    onView?: (customer: CustomerProduct) => void;
    onDelete?: (customer: CustomerProduct) => void;
    onLink?: (customer: CustomerProduct) => void;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: keyof CustomerProduct | null;
    direction: SortDirection;
}


const SortButton = React.memo<{
    label: string;
    sortKey: keyof CustomerProduct;
    sortConfig: SortConfig;
    onSort: (key: keyof CustomerProduct) => void;
}>(({ label, sortKey, sortConfig, onSort }) => {
    const icon = useMemo(() => {
        if (sortConfig.key === sortKey) {
            return sortConfig.direction === 'asc'
                ? <ChevronUpIcon className="w-4 h-4" />
                : <ChevronDownIcon className="w-4 h-4" />;
        }
        return null;
    }, [sortConfig.key, sortConfig.direction, sortKey]);

    return (
        <div
            onClick={() => onSort(sortKey)}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap group cursor-pointer"
        >
            {label}
            <span className="flex flex-col">
                {icon}
            </span>
        </div>
    );
});

SortButton.displayName = 'SortButton';

const CustomerListView: React.FC<CustomerListViewProps> = ({ customerData, onEdit, onView, onDelete, onLink }) => {
    const { t } = useTranslation();
    // Also masks the customer search picker, which renders this same table. Search is
    // server-side, so an agent who typed a full phone number still gets the matching row —
    // and `lastN` leaves the final four digits visible to confirm it is the right one.
    const { canViewPii, maskValue } = usePiiMasker();

    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: null,
        direction: 'asc',
    });

    const handleOnView = (customer: CustomerProduct) => {
        onView?.(customer);
    };

    const handleOnEdit = (customer: CustomerProduct) => {
        onEdit?.(customer);
    };

    const handleOnDelete = (customer: CustomerProduct) => {
        onDelete?.(customer);
    };


    const handleSort = useCallback((key: keyof CustomerProduct) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const sortedData = useMemo(() => {
        const data = [...customerData];
        if (sortConfig.key !== null) {
            data.sort((a, b) => {
                const aValue = a[sortConfig.key!] ?? '';
                const bValue = b[sortConfig.key!] ?? '';

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [customerData, sortConfig]);

    const handleOnLink = (customer: CustomerProduct) => {
        onLink?.(customer);
    };

    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-left">
                                <SortButton
                                    label={t("common.customer")}
                                    sortKey="displayName"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                />
                            </th>
                            <th className="px-6 py-4 text-left">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t("common.contact")}
                                </span>
                                {/* <SortButton 
                                    label={t("common.contact")} 
                                    sortKey="email"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                /> */}
                            </th>
                            <th className="px-6 py-4 text-center">
                                {/* <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t("common.product")}
                                </span> */}
                                <SortButton
                                    label={t("common.product")}
                                    sortKey="product"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                />
                            </th>
                            <th className="px-6 py-4 text-center">
                                {/* <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t("common.service")}
                                </span> */}
                                <SortButton
                                    label={t("common.service")}
                                    sortKey="service"
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                />
                            </th>

                            <th className="px-6 py-4 text-center">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t("common.type")}
                                </span>
                            </th>
                            <th className="px-6 py-4 text-center">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {t("common.active")}
                                </span>
                            </th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-center divide-gray-200 dark:divide-gray-700 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                        {sortedData.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {/* <div className="relative flex-shrink-0">
                                            <Avatar
                                                src={customer?.photo || "/images/user/unknow user.png"}
                                                size="medium"
                                            />
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${customer.active ? "bg-green-500" : "bg-red-500"}`} />
                                        </div> */}
                                        {/* Without `pii.view`, fall through to the initials. */}
                                        {canViewPii && customer.photo ? (
                                            <Avatar className="w-15 h-15 justify-center items-center">
                                                <img src={customer.photo} alt={customer.displayName} className="h-full w-full object-cover rounded-full"/>
                                            </Avatar>
                                        ) : (
                                            <div className="w-15 h-15 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                                                <span className="w-20 text-center uppercase">
                                                    {customer.firstName || customer.lastName
                                                        ? `${customer.firstName?.[0] || ""} ${customer.lastName?.[0] || ""}`.trim()
                                                        : customer.email?.[0] || "?"}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-45">
                                            {customer.displayName}
                                        </span>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 opacity-70" />
                                            <span>{maskValue("email", customer.email)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 opacity-70" />
                                            <span>{maskValue("mobileNo", customer.mobileNo)}</span>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <span>{customer.product}</span>
                                </td>
                                <td>
                                    <span>{customer.service}</span>
                                </td>
                                {/* <td>
                                    <span>{customer.case}</span>
                                </td> */}

                                <td className="px-6 py-4 text-center">
                                    <Badge variant="outline" className="py-0 px-2" size='sm'>
                                        {customer.userType ? i18nUserType(t, customer.userType) : t("userform.na")}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <Badge color={customer.active ? 'success' : "error"} className="py-0 px-2 capitalize" size='sm'>
                                        {customer.active ? t("active") : t("inactive")}
                                    </Badge>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        {!onLink && (
                                            <div className="flex items-center gap-1 mr-2 pr-2 border-r border-gray-200 dark:border-gray-700">
                                                <button className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors">
                                                    <Phone className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 text-purple-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors">
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors">
                                                    <ChatIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        {onView && <Button onClick={() => handleOnView(customer)} variant="primary" size="sm">{t("common.view")}</Button>}
                                        {onEdit && <Button onClick={() => handleOnEdit(customer)} variant="warning" size="sm">{t("common.edit")}</Button>}
                                        {onDelete && <Button onClick={() => handleOnDelete(customer)} variant="outline" size="sm">{t("common.delete")}</Button>}

                                        {onLink && <Button onClick={() => handleOnLink(customer)} variant="outline" size="sm">{t("common.select")}</Button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerListView;