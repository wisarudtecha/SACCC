import React from 'react';
import { useTranslation } from "@/core/hooks/useTranslation.ts";
import { SOPComponent, SOPFile, SOPStage } from '@/cms/types/dispatch';
import { FilePreviewCard } from '@/cms/components/Attachment/AttachmentPreviewList';
import { getFileIcon, formatFileSize } from '@/cms/components/Attachment/AttachmentConv';
import { Pagination } from '@/core/components/crud/Pagination';

interface SOPMetaDataProps {
    sopMetadata: SOPStage[];
}

const SOPMetaData: React.FC<SOPMetaDataProps> = ({ sopMetadata }) => {
    const { t } = useTranslation();

    const [pagination, setPagination] = React.useState({
        page: 1,
        pageSize: 1,
    });

    const totalCount = sopMetadata?.length || 0;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);

    const startEntry = (pagination.page - 1) * pagination.pageSize + 1;
    const endEntry = Math.min(startEntry + pagination.pageSize - 1, totalCount);

    const currentData = sopMetadata?.slice(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize
    );

    const renderComponentValue = (component: SOPComponent) => {
        const valueTextClasses = "text-md font-medium text-gray-900 dark:text-white";
        const labelTextClasses = "text-md text-gray-500 dark:text-gray-400";
        let valueContent: React.ReactNode;

        const renderLabel = (label: string) => (
            <span className={labelTextClasses}>{label}</span>
        );

        // if (component.type === "Topic") {
        //   return (
        //     <div className="mt-6 mb-3 border-b pb-1 border-gray-200 dark:border-gray-700">
        //       <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">
        //         {component.label}
        //       </h3>
        //     </div>
        //   );
        // }

        switch (component.type) {
            case "TextInput":
            case "TextArea":
            case "Topic":
            case "Radio":
                valueContent = component.value ? (
                    <span className="text-gray-900 dark:text-gray-100">{String(component.value)}</span>
                ) : (
                    <span className="italic text-gray-400">{t("formViewer.emptyValue")}</span>
                );
                break;

            case "InsertFile":
                // Handle both array of strings (URLs) and array of SOPFile objects
                const rawFiles = Array.isArray(component.value) ? component.value : [];

                valueContent = rawFiles.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                        {rawFiles.map((file, idx) => {
                            // CASE A: Data is just a string URL (from your JSON)
                            if (typeof file === 'string') {
                                return (
                                    // <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50">
                                    //     <img
                                    //         src={file}
                                    //         alt="SOP Attachment"
                                    //         className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                    //         onClick={() => window.open(file, '_blank')}
                                    //     />
                                        <FilePreviewCard
                                            file={{
                                                attId: "",
                                                attUrl: file,
                                                attName: "",
                                                orgId: "", caseId: "", createdAt: "", updatedAt: "", createdBy: "", updatedBy: ""
                                            } as any}
                                            getFileIcon={getFileIcon}
                                            formatFileSize={formatFileSize}
                                        />
                                    // </div>
                                );
                            }

                            // CASE B: Data is an SOPFile object
                            const fObj = file as SOPFile;
                            const isImg = fObj.isImage || fObj.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                            return (
                                <div key={fObj.id || idx} className="relative group">
                                    {isImg ? (
                                        <FilePreviewCard
                                            file={{
                                                ...fObj,
                                                attId: String(fObj.id || idx),
                                                attUrl: fObj.fileUrl,
                                                attName: fObj.originalFileName || "Image",
                                                orgId: "", caseId: "", createdAt: "", updatedAt: "", createdBy: "", updatedBy: ""
                                            } as any}
                                            getFileIcon={getFileIcon}
                                            formatFileSize={formatFileSize}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-2 text-center">
                                            <div className="text-xs font-semibold truncate w-full px-2">
                                                {fObj.originalFileName || "File"}
                                            </div>
                                            <button
                                                onClick={() => window.open(fObj.fileUrl, '_blank')}
                                                className="mt-2 text-[10px] text-blue-500 underline"
                                            >
                                                {t("common.download")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <span className="italic text-gray-400">{t("formViewer.noFiles")}</span>
                );
                break;

            default:
                valueContent = (
                    <p className="text-red-500">
                        {t("formViewer.unsupportedFieldType", { type: component.type })}
                    </p>
                );
                break;
        }

        return (
            <div className="mb-4 ml-2">
                <div className="mb-1">{renderLabel(component.label)}</div>
                <div className={valueTextClasses}>
                    {/* Indent content slightly for better readability */}
                    <div className="pl-4">{valueContent}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 ">
            {currentData?.map((stage) => (
                <section key={stage.stageNo} className="bg-white dark:bg-gray-900 rounded-xl  border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-xl font-bold dark:text-white">
                            {stage.displayName}
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {stage.components.map((component, index) => (
                            <React.Fragment key={`${stage.stageNo}-${index}`}>
                                {renderComponentValue(component)}
                            </React.Fragment>
                        ))}
                    </div>
                </section>
            ))}
            <div className="mt-6">
                <Pagination
                    pagination={{
                        page: pagination.page,
                        pageSize: pagination.pageSize,
                        total: totalCount
                    }}
                    
                    totalPages={totalPages}
                    startEntry={startEntry}
                    endEntry={endEntry}
                    onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                    onPageSizeChange={(newPageSize) => setPagination(prev => ({
                        ...prev,
                        pageSize: Number(newPageSize),
                        page: 1
                    }))}
                    disablePageSizeOptions={true}
                    disablePrevAndNextButton={true}
                    showAllPage={true}
                />
            </div>
        </div>
    );
};

export default SOPMetaData;