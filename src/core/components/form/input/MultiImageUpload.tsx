import { useState, useRef } from "react";

interface MultiImageUploadProps {
    field: {
        id: string;
        formRule?: {
            allowedFileTypes?: string[];
        };
    };
    labelComponent: React.ReactNode;
    disabled?:boolean
    onFilesSelect: (files: File[]) => void;
}


const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ field, labelComponent, onFilesSelect ,disabled =false }) => {
    const [, setSelectedFileNames] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileArray = Array.from(files);
            setSelectedFileNames((prev) => [...prev, ...fileArray.map((f) => f.name)]);
            onFilesSelect(fileArray);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <>
            {labelComponent}
            <div>
                <input
                    ref={fileInputRef}
                    id={field.id}
                    type="file"
                    accept={field.formRule?.allowedFileTypes?.join(",") || "image/*"}
                    multiple
                    disabled={disabled}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-500 dark:file:text-white hover:dark:file:bg-gray-600"
                    onChange={handleFileChange}
                />
            </div>
        </>
    );
};

export default MultiImageUpload