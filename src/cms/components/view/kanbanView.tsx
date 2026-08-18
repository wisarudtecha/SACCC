import React from 'react';
import Badge from '@/core/components/ui/badge/Badge';



interface KanbanColumn {
    title: string;
     
}

interface KanbanViewProps {
    columns: KanbanColumn[];
    renderColumnContent:  React.ReactNode;
    selectedColumnId?: string | null;
    itemCountColumn:number;
}


const KanbanView = ({ columns,itemCountColumn, renderColumnContent, selectedColumnId }: KanbanViewProps) => {
    return (
        <div className="flex space-x-6 overflow-x-auto pb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner min-h-[calc(100vh-32px)]">
            {columns.map((column) => {
                const isColumnVisible = !selectedColumnId || selectedColumnId === column.title;

                return (
                    isColumnVisible && (
                        <div key={column.title} className="flex-shrink-0 w-80 bg-white dark:bg-gray-700 rounded-lg shadow-md p-3">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{column.title}</h3>
                                 <Badge color="primary">{itemCountColumn}</Badge>
                            </div>
                            <div className="space-y-3 px-2 py-1 min-h-[100px] max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                                {renderColumnContent}
                            </div>
                        </div>
                    )
                );
            })}
        </div>
    );
};

export default KanbanView;