import { FileItem } from "@/cms/types/case";
import { isAttachment, formatFileSize, getFileIcon } from "./AttachmentConv";
import Button from "@/core/components/ui/button/Button";
import { useTranslation } from "@/core/hooks/useTranslation";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Modal } from "@/core/components/ui/modal";

interface FilePreviewCardProps {
    file: FileItem
    index?: number
    onRemove?: (index: number) => void
    getFileIcon: (file: FileItem) => React.ReactNode
    formatFileSize: (bytes: number) => string
    disabled?: boolean
    type?: string
    className?: string
    wrapperClassName?:string
}


interface ZoomImageProps {
    mediaUrl: string | null;
    mediaName: string;
    isOpen: boolean;
    onClose: () => void;
    mediaType?: 'image' | 'video';
}

export const ZoomImage: React.FC<ZoomImageProps> = ({
    mediaUrl,
    mediaName,
    isOpen,
    onClose,
    mediaType = 'image'
}) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
        }
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="max-w-4xl w-auto! max-h-[85vh]"
            showCloseButton={true}
            disableBgColor={true}
        >
            <div className="rounded-2xl flex flex-col h-full ">
                {/* Media Container */}
                <div className="flex-1 flex items-center justify-center relative overflow-auto custom-scrollbar">
                    {isLoading && (
                        <div className="text-center absolute">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
                        </div>
                    )}
                    {mediaUrl && mediaType === 'image' && (
                        <img
                            src={mediaUrl}
                            alt={mediaName}
                            className="w-auto h-auto object-contain rounded-2xl"
                            onLoad={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        />
                    )}
                    {mediaUrl && mediaType === 'video' && (
                        <video
                            src={mediaUrl}
                            controls
                            className="w-auto h-auto object-contain rounded-2xl"
                            onLoadedData={() => setIsLoading(false)}
                            onError={() => setIsLoading(false)}
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
            </div>
        </Modal>
    );
};

// FilePreviewCard Component
export const FilePreviewCard: React.FC<FilePreviewCardProps> = ({
    file,
    index,
    onRemove,
    getFileIcon,
    disabled = false,
    type = "",
    className,
    wrapperClassName
}) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [isRemoving, setIsRemoving] = useState<boolean>(false);
    const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);

    const handleRemove = async () => {
        if (onRemove && !isRemoving && index !== undefined) {
            setIsRemoving(true);
            try {
                await onRemove(index);
            } finally {
                setIsRemoving(false);
            }
        }
    };

    React.useEffect(() => {
        if (isAttachment(file)) {
            const isImage = file.attUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const isVideo = file.attUrl.match(/\.(mp4|webm|ogg|mov)$/i);

            if (isImage) {
                setPreview(file.attUrl);
                setMediaType('image');
            } else if (isVideo) {
                setPreview(file.attUrl);
                setMediaType('video');
            }

            // fetch(file.attUrl, { method: 'HEAD' })
            //     .catch(error => {
            //         console.error('Failed to fetch file size:', error);
            //     });
        } else {
            if (file?.type?.startsWith('image/')) {
                const objectUrl = URL.createObjectURL(file);
                setPreview(objectUrl);
                setMediaType('image');
                return () => URL.revokeObjectURL(objectUrl);
            } else if (file?.type?.startsWith('video/')) {
                const objectUrl = URL.createObjectURL(file);
                setPreview(objectUrl);
                setMediaType('video');
                return () => URL.revokeObjectURL(objectUrl);
            }
        }
    }, [file]);

    const handleZoom = () => {
        if (preview) {
            setIsZoomOpen(true);
        }
    };

    const handleCloseZoom = () => {
        setIsZoomOpen(false);
    };

    const fileName = isAttachment(file) ? file.attName : file.name;

    if (type !== "" && isAttachment(file) && file.type !== type) {
        return null;
    }

    return (
        <>
            <div className={`relative group rounded-lg overflow-hidden self-center`}>
                {/* Remove Button - Only show if not disabled */}
                {!disabled && onRemove && (
                    <Button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 z-10 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white disabled:bg-red-400"
                        size="sm"
                        disabled={isRemoving}
                    >
                        <X className="w-3 h-3" />
                    </Button>
                )}

                <div className={`p-3 `+ wrapperClassName}>
                    {preview ? (
                        <div className="mb-2">
                            {mediaType === 'image' ? (
                                <img
                                    src={preview}
                                    alt={fileName}
                                    className={`w-full h-50 aspect-3/4 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity ${className}`}
                                    onClick={handleZoom}
                                />
                            ) : (
                                <video
                                    src={preview}
                                    className={`w-full h-50 aspect-3/4 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity ${className}`}
                                    onClick={handleZoom}
                                    muted
                                    playsInline
                                />
                            )}
                        </div>
                    ) : (
                        <div
                            className={`flex items-center justify-center h-24 rounded mb-2 cursor-pointer `+ wrapperClassName}
                            onClick={handleZoom}
                        >
                            {getFileIcon(file)}
                        </div>
                    )}
                </div>
            </div>

            {/* Zoom Media Modal */}
            <ZoomImage
                mediaUrl={preview}
                mediaName={fileName}
                isOpen={isZoomOpen}
                onClose={handleCloseZoom}
                mediaType={mediaType}
            />
        </>
    );
};

export const FilePreviewCardWithDownload: React.FC<FilePreviewCardProps> = ({
    file,
    index,
    onRemove,
    getFileIcon,
    formatFileSize,
    disabled = false,
    type = ""
}) => {
    const [preview, setPreview] = useState<string | null>(null)
    const { t } = useTranslation();
    const [attachmentSize, setAttachmentSize] = useState<number | null>(null);
    const [isRemoving, setIsRemoving] = useState<boolean>(false)

    const handleRemove = async () => {
        console.log(index)
        if (onRemove && !isRemoving && index !== undefined) {
            setIsRemoving(true)
            try {
                await onRemove(index)
            } finally {
                setIsRemoving(false)
            }
        }
    }

    React.useEffect(() => {
        if (isAttachment(file)) {

            const isImage = file.attUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            if (isImage) {
                setPreview(file.attUrl);
            }
            fetch(file.attUrl, { method: 'HEAD' })
                .then(response => {
                    const size = response.headers.get('content-length');
                    if (size) {
                        setAttachmentSize(parseInt(size));
                    }
                })
                .catch(error => {
                    console.error('Failed to fetch file size:', error);
                })
        } else {
            // For File objects, create object URL
            if (file?.type?.startsWith('image/')) {
                const objectUrl = URL.createObjectURL(file)
                setPreview(objectUrl)
                return () => URL.revokeObjectURL(objectUrl)
            }
        }
    }, [file])

    const handleDownload = async () => {
        if (isAttachment(file)) {
            try {
                const response = await fetch(file.attUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.attName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Download failed:', error);
            }
        } else {
            const url = URL.createObjectURL(file)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
    }

    const fileName = isAttachment(file) ? file.attName : file.name;
    const fileSize = isAttachment(file) ? 0 : file.size; // Attachments don't have size
    const fileType = isAttachment(file)
        ? (file?.attUrl?.split('.').pop()?.toUpperCase() || 'FILE')
        : (file?.type?.split('/')[1]?.toUpperCase() || 'FILE');

    if (type !== "" && isAttachment(file) && file.type !== type) {
        return null;
    }

    return (
        <div className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
            {/* Remove Button - Only show if not disabled */}
            {!disabled && (
                <Button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 z-10 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white disabled:bg-red-400"
                    size="sm"
                    disabled={isRemoving}
                >
                    <X className="w-3 h-3" />
                </Button>
            )}

            <div className="p-3">
                {preview ? (
                    <div className="mb-2">
                        <img
                            src={preview}
                            alt={fileName}
                            className="w-full h-24 object-cover rounded cursor-pointer"
                            onClick={handleDownload}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-24 bg-gray-50 dark:bg-gray-700 rounded mb-2 cursor-pointer"
                        onClick={handleDownload}>
                        {getFileIcon(file)}
                    </div>
                )}


                <div className="space-y-1">
                    <p
                        className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        title={fileName}
                        onClick={handleDownload}
                    >
                        {fileName}
                    </p>
                    {fileSize > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(fileSize)}
                        </p>
                    )}
                    {isAttachment(file) && (
                        <p className="text-xs text-blue-500 dark:text-blue-400">
                            {formatFileSize(attachmentSize || 0)}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {fileType}
                    </p>
                </div>

                <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs py-1 h-7"
                >
                    {t("case.download")}
                </Button>
            </div>
        </div>
    )
}

const AttachedFiles = ({
    files,
    editFormData,
    onRemove,
    type,
    className
}: {
    files?: FileItem[];
    editFormData: boolean;
    onRemove?: (index: number) => void;
    type: string;
    className?: string;
}) => {
    if (!files?.length) return null;
    // const { t } = useTranslation()

    return (
        <div className={className}>
            {/* <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
          {t("case.display.attach_file")} :
      </span> */}
            <div className="mt-2 mb-3">
                <div className="grid grid-cols-3">
                    {files.map((file, index) =>
                        <FilePreviewCard
                            key={isAttachment(file) ? file.attId : `${file.name}-${index}`}
                            file={file}
                            index={index}
                            formatFileSize={formatFileSize}
                            onRemove={onRemove}
                            type={type}
                            disabled={!editFormData}
                            getFileIcon={getFileIcon}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttachedFiles;
