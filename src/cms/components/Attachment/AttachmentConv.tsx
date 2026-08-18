import { Attachment, FileItem } from "@/cms/types/case";
import { FileText, ImageIcon, File as FileIcon } from "lucide-react";

export function isAttachment(item: FileItem): item is Attachment {
    return 'attUrl' in item && 'attId' in item;
}



export const getFileIcon = (item: FileItem) => {
    const fileType = isAttachment(item)
        ? (item.type || getMimeTypeFromUrl(item.attUrl))
        : (item.type || "");

    if (fileType.startsWith('image/')) {
        return <ImageIcon className="w-6 h-6 text-blue-500" />
    } else if (fileType === 'application/pdf' || fileType.includes('pdf')) {
        return <FileText className="w-6 h-6 text-red-500" />
    } else if (fileType.includes('document') || fileType.includes('word')) {
        return <FileText className="w-6 h-6 text-blue-600" />
    }
    return <FileIcon className="w-6 h-6 text-gray-500" />
}

export const getMimeTypeFromUrl = (url: string): string => {
    if (!url) return 'application/octet-stream';
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
}

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Convert a single attachment URL to File object
async function attachmentToFile(attachment: Attachment): Promise<File> {
    try {
        // Fetch the file from the URL
        const response = await fetch(attachment.attUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        // Get the blob
        const blob = await response.blob();

        // Extract the original filename or use attName
        const filename = attachment.attName;

        // Determine MIME type from blob or filename
        const mimeType = blob.type || getMimeTypeFromFilename(filename);

        // Create File object
        const file = new File([blob], filename, {
            type: mimeType,
            lastModified: new Date(attachment.updatedAt).getTime() || Date.now()
        });

        return file;
    } catch (error) {
        console.error(`Error converting attachment ${attachment.attId}:`, error);
        throw error;
    }
}


export async function attachmentsToFiles(attachments: Attachment[]): Promise<File[]> {
    const filePromises = attachments.map(attachment => attachmentToFile(attachment));
    return Promise.all(filePromises);
}

function getMimeTypeFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'csv': 'text/csv',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
}


export const validateFile = (file: File, accept: string = "image/*,.pdf,.doc,.docx,.txt",
    maxSize: number = 1): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
        return false
    }
    const acceptedTypes = accept.split(',').map(type => type.trim())
    const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        return file.type.match(type.replace('*', '.*'))
    })

    if (!isAccepted) {
        return false
    }

    return true
}