"use client"
import React, { useCallback, useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { useTranslation } from '@/core/hooks/useTranslation'
import { Attachment } from '@/cms/types/case'
import { formatFileSize, getFileIcon, isAttachment } from '@/cms/components/Attachment/AttachmentConv'
import { useDeleteFileMutationMutation, usePostUploadFileMutationMutation } from '@/core/store/api/file'
import { FilePreviewCard } from '@/cms/components/Attachment/AttachmentPreviewList'
import { ToastContainer } from '@/core/components/crud/ToastContainer'
import { useToast } from '@/core/hooks'


export type FileItem = File | Attachment;


interface DragDropFileUploadProps {
  files: FileItem[]
  onFilesChange: (files: any) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
  caseId?: string
  disableDelImageButton?:boolean,
  type: string
}

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({
  files,
  onFilesChange,
  accept = "image/*,.pdf,.doc,.docx,.txt",
  maxSize = 1,
  className = "",
  disabled = false,
  caseId = "",
  disableDelImageButton=false,
  type = ""
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation();
  const [delFileApi] = useDeleteFileMutationMutation();
  const [postUploadFile] = usePostUploadFileMutationMutation();
  const { toasts, addToast, removeToast } = useToast();
  const validateFile = (file: File): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File "${file.name}" is too large. Maximum size is ${maxSize}MB.`)
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
      setError(`File type "${file.type}" is not accepted.`)
      return false
    }

    setError(null)
    return true
  }

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList).filter(validateFile)
    if (caseId != "") {
      const uploadedAttachments: Attachment[] = [];
      for (const file of newFiles) {
        try {
          if (isAttachment(file))
            continue
          const result = await postUploadFile({
            path: type,
            file: file,
            caseId: caseId || ""
          }).unwrap();

          if (result.data) {
            uploadedAttachments.push(result.data)
            console.log(`✅ Uploaded ${file.name}`);
          } else {
            console.error(`❌ Failed to upload ${file.name}`);
            addToast("error", `${t("case.display.toast.upload_file_fail")}: ${file.name}`);
          }
        } catch (error) {
          console.error(`❌ Error uploading ${file.name}:`, error);
          addToast("error", `${t("case.display.toast.upload_file_fail")}: ${file.name}`);
        }
      }

      if (uploadedAttachments.length > 0) {
        // addToast("success", t("case.display.toast.upload_file_success"));
        onFilesChange([...files, ...uploadedAttachments])
        return
      }
    }
    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles])
    }
  }, [files, onFilesChange])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }, [disabled, processFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles)
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [processFiles])

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = async (index: number) => {
    const fileToRemove = files[index];
    if (isAttachment(fileToRemove)) {
      try {
        const result = await delFileApi({
          attId: fileToRemove.attId,
          caseId: caseId || "",
          filename: fileToRemove.attName,
          path: type
        });

        if (!result.data) {
          console.error(`Failed to delete ${fileToRemove.attName}`);
          addToast("error", `${t("case.display.toast.upload_file_fail")}: ${fileToRemove}`);
          return;
        }

        console.log(`Successfully deleted ${fileToRemove.attName}`);
      } catch (error) {
        console.error(`Failed to delete ${fileToRemove.attName}:`, error);
        addToast("error", `${t("case.display.toast.upload_file_fail")}: ${fileToRemove}`);
        return;
      }
    }
    const updatedFiles = files.filter((_, i) => i !== index)
    onFilesChange(updatedFiles)
  }




  return (
    <div className={`w-full ${className}`}>
      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          bg-gray-50 dark:bg-gray-800
        `}
        onClick={!disabled ? handleButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className={`w-8 h-8 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="text-gray-600 dark:text-gray-300">
            <p className="text-sm font-medium">
              {isDragOver ? t("case.dnd_text_des_over") : t("case.dnd_text_des")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t("case.supports")} {t("case.images")}, PDF, DOC, DOCX, TXT ({t("case.max")} {maxSize}MB {t("case.each")} )
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="mt-4">
          {/* <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("case.display.attach_file")} ({files.length})
          </h4> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((file, index) => (
              <FilePreviewCard
                key={isAttachment(file) ? file.attId : `${file.name}-${index}`}
                file={file}
                index={index}
                onRemove={removeFile}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                disabled={disabled||disableDelImageButton}
                type={type}
              />
            ))}
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}



export default DragDropFileUpload
