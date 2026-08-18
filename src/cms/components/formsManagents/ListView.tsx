// /src/components/workflow/list/FormTableView.tsx
import React, { SetStateAction } from 'react';
import {
    ChevronDownIcon,
    ChevronUpIcon,
} from "@/core/icons";
import ButtonAction from './ButtonAction';
import { FormManager } from '../interface/FormField';
import { getAvatarIconFromString } from '../avatar/createAvatarFromString';
import Button from '@/core/components/ui/button/Button';
import { formatDate } from '@/core/utils/crud';
import { useTranslation } from '@/core/hooks/useTranslation';
import ViewWorkFlow from './viewWorkFlow';

interface SortConfig {
    key: keyof FormManager | null;
    direction: 'asc' | 'desc';
}

interface FormTableViewProps {
    forms: FormManager[];
    setForms: React.Dispatch<SetStateAction<FormManager[]>>
    handleSort: (key: keyof FormManager) => void;
    sortConfig: SortConfig;
    onSetStatusInactive: (formId: string, formName: string, newStatus: FormManager['active']) => void;
    handleOnEdit: (form: FormManager) => void;
    handleOnView: (form: FormManager) => void;
    handleOnVersion?: (form: FormManager) => void;
}

const ListViewFormManager: React.FC<FormTableViewProps> = ({
    forms,
    handleSort,
    sortConfig,
    onSetStatusInactive,
    setForms,
    handleOnEdit,
    handleOnView,
    handleOnVersion
}) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border-none overflow-hidden mb-8">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left w-auto">
                                <button
                                    onClick={() => handleSort('formName')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap"
                                >
                                    {t("common.name")}
                                    {sortConfig.key === 'formName' && (
                                        sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left w-auto">
                                <button
                                    onClick={() => handleSort('active')}
                                    className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap"
                                >
                                    {t("common.version")}
                                    {sortConfig.key === 'active' && (
                                        sortConfig.direction === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-auto whitespace-nowrap">
                                {t("common.create")}
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-auto">

                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {forms.map((form) => {
                            return (
                                <tr  className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 w-auto">
                                        <div className="flex items-center gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate w-60">{form.formName}</div>
                                                {form.workflows&& <ViewWorkFlow workflows={form.workflows} />}

                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {/* {form.description} */}
                                                </div>
                                            </div>
                                            {/* {form.workflows?.length != 0 &&
                                                <Badge size='xxs'>
                                                    ถูกใช้อยู่
                                                </Badge>
                                            } */}
                                            {/* {form.workflows && form.workflows.map((item) => (
                                                <Badge key={item.wfId} size='xxs'>
                                                    {item.title}
                                                </Badge>
                                                ))} */}

                                            {/* {form?.versionsInfoList &&
                                                form.versionsInfoList.length > 0 &&
                                                Number(form.versions) < Math.max(...form.versionsInfoList.map(Number)) && (
                                                    <Badge color="warning" className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                                        {t("common.new_version")}
                                                    </Badge>
                                                )} */}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 w-auto whitespace-nowrap">
                                        <Button
                                            className="w-auto rounded-full text-xs font-medium"
                                            variant="outline"
                                            onClick={() => { handleOnVersion && handleOnVersion(form) }}
                                        >
                                            v.{form.versions}
                                        </Button>
                                    </td>

                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 w-auto whitespace-nowrap">
                                        <div className="flex items-center  gap-2">
                                            
                                           {formatDate(form.createdAt)} {t("common.by")} {getAvatarIconFromString(form.createdBy, "bg-blue-600 dark:bg-blue-700")} {form.createdBy}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 w-auto whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-2">
                                            <ButtonAction
                                                form={form}
                                                type='list'
                                                setForms={setForms}
                                                onSetStatusChange={onSetStatusInactive}
                                                handleOnEdit={() => handleOnEdit(form)}
                                                handleOnView={() => handleOnView(form)} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListViewFormManager;