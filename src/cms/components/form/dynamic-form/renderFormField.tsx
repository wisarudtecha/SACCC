import React, { useCallback, useRef } from 'react';
import DndImageUploader from '../input/DndImageUploader.tsx';
import PhoneInput from 'react-phone-number-input/input';
import { CountryCode } from './DynamicForm.tsx';
import { commonClasses } from './constant.tsx';
import { SearchableSelect } from '@/cms/components/SearchInput/SearchSelectInput';
import Input from '@/core/components/form/input/InputField.tsx';
import DndMultiImageUploader from '../input/DndMultiImageUploader.tsx.tsx';
import MultiImageUpload from '@/core/components/form/input/MultiImageUpload.tsx';
import { FormFieldWithChildren, IndividualFormFieldWithChildren } from '@/cms/components/interface/FormField';
import { getResponsiveColSpanClass, getResponsiveGridClass, updateFieldRecursively } from './function.ts';
import { validateFieldValue } from './validateDynamicForm.tsx';
import { FilePreviewCard } from '@/cms/components/Attachment/AttachmentPreviewList.tsx';
import { formatFileSize, getFileIcon, validateFile } from '@/cms/components/Attachment/AttachmentConv.tsx';
import { usePostUploadFileMutationMutation } from '@/core/store/api/file.ts';
import { FileItem } from '@/cms/types/case.ts';
import { useToast } from '@/core/hooks/useToast.ts';
import { ToastContainer } from '@/core/components/crud/ToastContainer.tsx';
import { useTranslation } from '@/core/hooks/useTranslation.ts';
import { PII_FULL_MASK, getDynamicFieldPiiRule } from '@/core/security/piiFields';

interface renderRenderFormFieldProps {
    field: IndividualFormFieldWithChildren;
    editFormData: boolean;
    showValidationErrors: boolean;
    setCurrentForm: React.Dispatch<React.SetStateAction<FormFieldWithChildren>>
    /** Opt-in only - see `DynamicForm`. Most call sites (case/SOP forms) leave this unset. */
    maskPii?: boolean;
    /** Whether this user may see unmasked PII. Ignored when `maskPii` is false. */
    canViewPii?: boolean;
}

const RenderFormField: React.FC<renderRenderFormFieldProps> = ({
    field,
    editFormData,
    showValidationErrors,
    setCurrentForm,
    maskPii = false,
    canViewPii = false,
}) => {
    // A marked field with no `pii.view` renders locked: blanked and disabled, never a masked
    // *string* in `value` - the real value stays in `field.value`/`formFieldJson` untouched,
    // since a disabled input never fires `onChange`. Same mechanism as `lockPiiInput` on the
    // static customer form.
    const piiRule = maskPii ? getDynamicFieldPiiRule(field) : undefined;
    const isLocked = !!piiRule && !canViewPii;

    const commonProps = {
        id: field.id,
        className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent dark:text-gray-300 dark:border-gray-800 dark:bg-gray-900 disabled:text-gray-500 disabled:border-gray-300 disabled:bg-gray-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-400 dark:disabled:border-gray-700 autofill:shadow-[inset_0_0_0px_1000px_white] autofill:[-webkit-text-fill-color:rgb(55,65,81)] dark:autofill:shadow-[inset_0_0_0px_1000px_rgb(17,24,39)] dark:autofill:[-webkit-text-fill-color:rgb(209,213,219)]",
        placeholder: isLocked ? PII_FULL_MASK : (field.placeholder || (field.label && `Enter ${field.label.toLowerCase()}`)),
        required: field.required,
        disabled: !editFormData || isLocked,
    };

    const { t } = useTranslation();
    const [postUploadFile] = usePostUploadFileMutationMutation();
    const { toasts, addToast, removeToast } = useToast();
    const uploadingRef = useRef<Set<string>>(new Set());

    const handleFileUpload = async (fieldId: string, files: File[], isMultiple: boolean = false) => {
        if (!files || files.length === 0) {
            return;
        }

        const uploadKey = `${fieldId}-${files.map(f => `${f.name}-${f.size}`).join('-')}-${Date.now()}`;

        if (uploadingRef.current.has(uploadKey)) {
            console.log('⚠️ Upload already in progress, skipping');
            return;
        }

        uploadingRef.current.add(uploadKey);

        const uploadedFiles: FileItem[] = [];

        try {
            for (const file of files) {
                try {
                    if (!validateFile(file)) {
                        addToast("error", `File "${file.name}" is too large.`);
                        continue;
                    }

                    const result = await postUploadFile({
                        path: "dynamicForm",
                        file: file,
                    }).unwrap();

                    if (result.data) {
                        uploadedFiles.push(result.data);
                        console.log(`✅ Uploaded ${file.name}`);
                    } else {
                        console.error(`❌ Failed to upload ${file.name}`);
                        addToast?.("error", `${t("case.display.toast.upload_file_fail")}: ${file.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Error uploading ${file.name}:`, error);
                    addToast?.("error", `${t("case.display.toast.upload_file_fail")}: ${file.name}`);
                }
            }

            if (uploadedFiles.length > 0) {
                setCurrentForm(prevForm => ({
                    ...prevForm,
                    formFieldJson: updateFieldRecursively(prevForm.formFieldJson, fieldId, (field) => {
                        if (isMultiple) {
                            const currentFiles = Array.isArray(field.value) ? field.value : [];
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const existingFileItems = currentFiles.filter((f: any) => !(f instanceof File));
                            return { ...field, value: [...existingFileItems, ...uploadedFiles] };
                        } else {
                            return { ...field, value: uploadedFiles[0] };
                        }
                    }),
                }));
            }
        } catch (error) {
            console.error("Error during file upload process:", error);
            addToast?.("error", t("case.display.toast.upload_file_fail"));
        } finally {
            setTimeout(() => {
                uploadingRef.current.delete(uploadKey);
            }, 500);
        }
    };

    const handleRemoveFile = (fieldId: string, indexToRemove?: number) => {

        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, fieldId, (field) => {
                if (field.type === "image" || field.type === "dndImage") {
                    return { ...field, value: null };
                } else if ((field.type === "multiImage" || field.type === "dndMultiImage") && Array.isArray(field.value)) {
                    if (indexToRemove !== undefined) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const updatedFiles = field.value.filter((_: any, index: number) => index !== indexToRemove);
                        return { ...field, value: updatedFiles };
                    }
                }
                return field;
            }),
        }));
    };

    const labelComponent = field.showLabel ? (
        <label htmlFor={field.id} className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-400">
            {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
    ) : (
         <label htmlFor={field.id} className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-400">
        {"\u00A0"} {field.required && <span className="text-red-500">*</span>}
        </label>
    );

    const FieldError: React.FC<{ field: IndividualFormFieldWithChildren }> = useCallback(({ field }) => {
        if (!showValidationErrors) {
            return null;
        }
        const errors = validateFieldValue(field);
        if (errors.length > 0) {
            return <div>
                {errors.map((item)=>{return<p className="text-red-500 text-xs italic mt-1">{item}</p>})}
            </div>;
        }
        return null;
    }, [showValidationErrors]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFieldChange = useCallback((id: string, newValue: any) => {
        if (field.type === "image" || field.type === "dndImage") {
            let fileToUpload: File | null = null;

            if (newValue instanceof FileList && newValue.length > 0) {
                fileToUpload = newValue[0];
            } else if (newValue instanceof File) {
                fileToUpload = newValue;
            }

            if (fileToUpload) {
                handleFileUpload(id, [fileToUpload], false);
                return;
            }
        }

        if (field.type === "multiImage" || field.type === "dndMultiImage") {
            let filesToUpload: File[] = [];

            if (newValue instanceof FileList) {
                filesToUpload = Array.from(newValue);
            } else if (Array.isArray(newValue)) {
                filesToUpload = newValue.filter((f): f is File => f instanceof File);
            }

            if (filesToUpload.length > 0) {
                handleFileUpload(id, filesToUpload, true);
                return;
            }
        }

        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => {
                if (field.type === "phoneNumber") {
                    return { ...field, value: newValue ?? "" }
                }
                if (field.type === "Integer") {
                    const max = field.formRule?.maxnumber ?? Infinity;
                    const min = field.formRule?.minnumber ?? -Infinity;
                    const numValue = parseInt(newValue, 10);
                    if (isNaN(numValue)) {
                        return { ...field, value: null };
                    }
                    const clampedValue = Math.max(min, Math.min(max, numValue));
                    return { ...field, value: clampedValue };
                }
                if (field.type === "InputGroup") {
                    return { ...field, value: field.value };
                }
                if (field.type === "select" || field.type === "dynamicField") {
                    return { ...field, value: String(newValue) };
                }
                return { ...field, value: newValue };
            }),
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [field.type]);

    const renderTextInput = () => (
        <>
            {labelComponent}
            <Input
                maxlength={field.formRule?.maxLength}
                minlength={field.formRule?.minLength}
                type={field.type === "textInput" ? "text" : field.type === "emailInput" ? "email" : "password"}
                value={isLocked ? "" : (field.value as string)}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                {...commonProps}
            />
            <FieldError field={field} />
        </>
    );

    const renderInteger = () => (
        <>
            {labelComponent}
            <Input
                type="number"
                value={isLocked ? "" : (field.value !== null ? field.value : '')}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                {...commonProps}
            />
            <FieldError field={field} />
        </>
    );

    const renderDateInput = () => (
        <>
            {labelComponent}
            <Input
                type="date"
                min={field.formRule?.minDate !== undefined ? field.formRule.minDate.toString() : undefined}
                max={field.formRule?.maxDate !== undefined ? field.formRule.maxDate.toString() : undefined}
                value={isLocked ? "" : (field.value as string)}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                {...commonProps}
                className="rounded-lg border border-gray-200 bg-transparent py-2 px-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 disabled:dark:bg-gray-800 disabled:dark:border-gray-700 disabled:border-gray-300 disabled:bg-gray-100"
            />
            <FieldError field={field} />
        </>
    );

    const renderDateLocal = () => (
        <>
            {labelComponent}
            <Input
                min={field.formRule?.minLocalDate !== undefined ? field.formRule.minLocalDate.toString() : undefined}
                max={field.formRule?.maxLocalDate !== undefined ? field.formRule.maxLocalDate.toString() : undefined}
                type="datetime-local"
                value={isLocked ? "" : (field.value as string)}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                {...commonProps}
                className="dark:[&::-webkit-calendar-picker-indicator]:invert rounded-lg border border-gray-200 bg-transparent py-2 px-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 disabled:dark:bg-gray-800 disabled:dark:border-gray-700 disabled:border-gray-300 disabled:bg-gray-100"
            />
            <FieldError field={field} />
        </>
    );

    const renderTextArea = () => (
        <>
            {labelComponent}
            <textarea
                maxLength={field.formRule?.maxLength}
                minLength={field.formRule?.minLength}
                value={isLocked ? "" : (field.value as string)}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                {...commonProps}
                className={`${commonProps.className} ${commonProps.disabled ? 'text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' : 'bg-transparent dark:bg-gray-900'} rounded-lg border border-gray-200 bg-transparent py-2 px-3 text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 disabled:dark:border-gray-700 disabled:border-gray-300 disabled:bg-gray-100`}
            />
            <FieldError field={field} />
        </>
    );

    const renderSelect = () => {
        if (field.enableSearch) {
            return (
                <>
                    {labelComponent}
                    <SearchableSelect
                        options={field.options || []}
                        value={String(field.value || "")}
                        onChange={(newValue) => handleFieldChange(field.id, newValue)}
                        placeholder={field.placeholder || "Select an option"}
                        disabled={!editFormData}
                    />
                    <FieldError field={field} />
                </>
            );
        }

        return (
            <>
                {labelComponent}
                <select
                    value={String(field.value || "")}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    {...commonProps}
                    className={`${commonProps.className} ${commonProps.disabled ? 'bg-gray-100 dark:bg-gray-800' : ' dark:bg-gray-900 bg-transparent'}`}
                >
                    <option value="">{field.placeholder || "Select an option"}</option>
                    {field.options?.map((option) => (
                        <option className="text-gray-700 dark:text-white dark:bg-gray-800" key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <FieldError field={field} />
            </>
        );
    };

    const renderOption = () => (
        <>
            {labelComponent}
            <div className="flex flex-col gap-2">
                {field.options?.map((option) => (
                    <label key={option} className="inline-flex items-center">
                        <input
                            type="checkbox"
                            value={option}
                            checked={Array.isArray(field.value) && field.value.includes(option)}
                            onChange={(e) => {
                                const currentValues = Array.isArray(field.value) ? [...field.value] : [];
                                if (e.target.checked) {
                                    handleFieldChange(field.id, [...currentValues, option]);
                                } else {
                                    handleFieldChange(field.id, currentValues.filter((val: string) => val !== option));
                                }
                            }}
                            className="form-checkbox h-5 w-5 text-blue-600 rounded"
                            required={field.required && Array.isArray(field.value) && field.value.length === 0}
                            disabled={!editFormData}
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-400">{option}</span>
                    </label>
                ))}
            </div>
            <FieldError field={field} />
        </>
    );

    const renderRadio = () => (
        <>
            {labelComponent}
            <div className="flex flex-col gap-2">
                {field.options?.map((option) => (
                    <label key={option} className="inline-flex items-center">
                        <input
                            type="radio"
                            name={field.id}
                            value={option}
                            checked={field.value === option}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="form-radio h-5 w-5 text-blue-600"
                            required={field.required}
                            disabled={!editFormData}
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-400">{option}</span>
                    </label>
                ))}
            </div>
            <FieldError field={field} />
        </>
    );

    const renderPhoneNumber = () => (
        <>
            {labelComponent}
            <PhoneInput
                placeholder="Enter phone number"
                countries={field.formRule?.allowedCountries as CountryCode[]}
                value={field.value || ""}
                onChange={(value) => handleFieldChange(field.id, value)}
                defaultCountry="TH"
                className={commonClasses + " p-3!"}
            />
            <FieldError field={field} />
        </>
    );

    const renderDndImage = () => (
        <div>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            {labelComponent}
            <DndImageUploader
                onFileSelect={(file) => handleFieldChange(field.id, file)}
                existingFile={field.value instanceof File ? field.value : null}
                handleRemoveFile={() => handleRemoveFile(field.id)}
                disabled={!editFormData}
                accept={field.formRule?.allowedFileTypes?.join(',')}
            />
            {field.value && !(field.value instanceof File) && (
                <div className="mt-2">
                    <FilePreviewCard
                        file={field.value as FileItem}
                        disabled={!editFormData}
                        index={0}
                        getFileIcon={getFileIcon}
                        formatFileSize={formatFileSize}
                        onRemove={() => handleRemoveFile(field.id)}
                    />
                </div>
            )}
            <FieldError field={field} />
        </div>
    );

    const renderImage = () => (
        <>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            {labelComponent}
            <div>
                <input
                    id={field.id}
                    type="file"
                    accept={field.formRule?.allowedFileTypes?.join(',') || 'image/*'}
                    onChange={(e) => {
                        handleFieldChange(field.id, e.target.files);
                        e.target.value = ''; // Reset to allow re-upload
                    }}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-500 dark:file:text-white hover:dark:file:bg-gray-600"
                    required={field.required && !field.value}
                    disabled={!editFormData}
                />
                {field.value && !(field.value instanceof File) && (
                    <div className="mt-2">
                        <FilePreviewCard
                            file={field.value as FileItem}
                            disabled={!editFormData}
                            getFileIcon={getFileIcon}
                            index={0}
                            formatFileSize={formatFileSize}
                            onRemove={() => handleRemoveFile(field.id)}
                        />
                    </div>
                )}
            </div>
            <FieldError field={field} />
        </>
    );

    const renderMultiImage = () => {
        // Get actual indices for FileItem objects in the original array
        const fileItemIndices: number[] = [];
        if (Array.isArray(field.value)) {
            field.value.forEach((file, index) => {
                if (!(file instanceof File)) {
                    fileItemIndices.push(index);
                }
            });
        }

        return (
            <div>
                <ToastContainer toasts={toasts} onRemove={removeToast} />
                {labelComponent}
                <div>
                    <MultiImageUpload
                        field={field}
                        labelComponent={null}
                        onFilesSelect={(files) => handleFieldChange(field.id, files)}
                        disabled={!editFormData}
                    />
                    {Array.isArray(field.value) && fileItemIndices.length > 0 && (
                        <div className="mt-2">
                            <p className="text-gray-700 dark:text-white text-sm mb-1">Selected Files:</p>
                            <div className="grid grid-cols-3 gap-2">
                                {fileItemIndices.map((actualIndex) => {
                                    const file = field.value[actualIndex];
                                    return (
                                        <FilePreviewCard
                                            key={actualIndex}
                                            file={file as FileItem}
                                            index={actualIndex}
                                            disabled={!editFormData}
                                            getFileIcon={getFileIcon}
                                            formatFileSize={formatFileSize}
                                            onRemove={() => handleRemoveFile(field.id, actualIndex)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <FieldError field={field} />
            </div>
        );
    };

    const renderDndMultiImage = () => {
        // Get actual indices for FileItem objects
        const fileItemIndices: number[] = [];
        if (Array.isArray(field.value)) {
            field.value.forEach((file, index) => {
                if (!(file instanceof File)) {
                    fileItemIndices.push(index);
                }
            });
        }

        return (
            <div>
                <ToastContainer toasts={toasts} onRemove={removeToast} />
                {labelComponent}
                <DndMultiImageUploader
                    onFilesSelect={(files) => handleFieldChange(field.id, files)}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    existingFiles={Array.isArray(field.value) ? field.value.filter((f: any) => f instanceof File) : []}
                    handleRemoveFile={(index) => {
                        // This removes File objects from DndMultiImageUploader
                        // Find the actual index of File objects
                        const fileIndices: number[] = [];
                        if (Array.isArray(field.value)) {
                            field.value.forEach((file, i) => {
                                if (file instanceof File) {
                                    fileIndices.push(i);
                                }
                            });
                        }
                        if (fileIndices[index] !== undefined) {
                            handleRemoveFile(field.id, fileIndices[index]);
                        }
                    }}
                    disabled={!editFormData}
                    accept={field.formRule?.allowedFileTypes?.join(',')}
                />
                {Array.isArray(field.value) && fileItemIndices.length > 0 && (
                    <div className="mt-2">
                        <p className="text-gray-700 dark:text-white text-sm mb-1">Uploaded Files:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {fileItemIndices.map((actualIndex) => {
                                const file = field.value[actualIndex];
                                return (
                                    <FilePreviewCard
                                        key={actualIndex}
                                        file={file as FileItem}
                                        index={actualIndex}
                                        disabled={!editFormData}
                                        getFileIcon={getFileIcon}
                                        formatFileSize={formatFileSize}
                                        onRemove={() => handleRemoveFile(field.id, actualIndex)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
                <FieldError field={field} />
            </div>
        );
    };

    const renderInputGroup = () => (
        <div>
            {field.showLabel && (
                <h3 className="text-sm font-semibold mb-3 dark:text-gray-400">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                </h3>
            )}
            <div className={`grid grid-cols-1 ${getResponsiveGridClass(field.GroupColSpan)} gap-4`}>
                {Array.isArray(field.value) &&
                    field.value.map((childField: IndividualFormFieldWithChildren) => (
                        <div key={childField.id} className={getResponsiveColSpanClass(childField.colSpan)}>
                            <RenderFormField
                                setCurrentForm={setCurrentForm}
                                field={childField}
                                editFormData={editFormData}
                                showValidationErrors={showValidationErrors}
                                maskPii={maskPii}
                                canViewPii={canViewPii}
                            />
                        </div>
                    ))}
            </div>
            {Array.isArray(field.value) && field.value.length === 0 && (
                <p className="text-center text-gray-500 italic text-sm mt-2">
                    No fields in this group for preview.
                </p>
            )}
        </div>
    );

    const renderDynamicField = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const selectedOption = field.options?.find((option: any) => option.value === field.value);

        if (field.enableSearch) {
            return (
                <>
                    {labelComponent}
                    <SearchableSelect
                        options={field.options || []}
                        value={String(field.value || "")}
                        onChange={(newValue) => handleFieldChange(field.id, newValue)}
                        placeholder={field.placeholder || "Select an option"}
                        disabled={!editFormData}
                        isDynamic={true}
                    />
                    <FieldError field={field} />
                    {selectedOption && Array.isArray(selectedOption.form) && (
                        <div className="mt-4 pt-4">
                            <div className={`grid grid-cols-1 ${getResponsiveGridClass(field.DynamicFieldColSpan)} gap-4`}>
                                {selectedOption.form.map((nestedField: IndividualFormFieldWithChildren) => (
                                    <div key={nestedField.id} className={getResponsiveColSpanClass(nestedField.colSpan)}>
                                        <RenderFormField
                                            setCurrentForm={setCurrentForm}
                                            field={nestedField}
                                            editFormData={editFormData}
                                            showValidationErrors={showValidationErrors}
                                            maskPii={maskPii}
                                            canViewPii={canViewPii}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );
        }

        return (
            <>
                {labelComponent}
                <select
                    value={String(field.value || "")}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    {...commonProps}
                    className={`${commonProps.className} bg-white dark:bg-gray-800 disabled:opacity-50`}
                >
                    <option value="" className="dark:bg-gray-800">
                        {field.placeholder || "Select an option"}
                    </option>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {field.options?.map((option: any) => (
                        <option className="text-gray-700 dark:text-white dark:bg-gray-800" key={option.value} value={option.value}>
                            {option.value}
                        </option>
                    ))}
                </select>
                <FieldError field={field} />
                {selectedOption && Array.isArray(selectedOption.form) && (
                    <div className="mt-4 pt-4">
                        <div className={`grid grid-cols-1 ${getResponsiveGridClass(field.DynamicFieldColSpan)} gap-4`}>
                            {selectedOption.form.map((nestedField: IndividualFormFieldWithChildren) => (
                                <div key={nestedField.id} className={getResponsiveColSpanClass(nestedField.colSpan)}>
                                    <RenderFormField
                                        setCurrentForm={setCurrentForm}
                                        field={nestedField}
                                        editFormData={editFormData}
                                        showValidationErrors={showValidationErrors}
                                        maskPii={maskPii}
                                        canViewPii={canViewPii}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <>
            {(() => {
                switch (field.type) {
                    case "textInput":
                    case "emailInput":
                    case "passwordInput":
                        return renderTextInput();
                    case "Integer":
                        return renderInteger();
                    case "dateInput":
                        return renderDateInput();
                    case "dateLocal":
                        return renderDateLocal();
                    case "textAreaInput":
                        return renderTextArea();
                    case "select":
                        return renderSelect();
                    case "option":
                        return renderOption();
                    case "radio":
                        return renderRadio();
                    case "phoneNumber":
                        return renderPhoneNumber();
                    case "dndImage":
                        return renderDndImage();
                    case "image":
                        return renderImage();
                    case "multiImage":
                        return renderMultiImage();
                    case "dndMultiImage":
                        return renderDndMultiImage();
                    case "InputGroup":
                        return renderInputGroup();
                    case "dynamicField":
                        return renderDynamicField();
                    default:
                        return <p className="text-red-500">Unsupported field type: {field.type}</p>;
                }
            })()}
        </>
    );
};

export default RenderFormField;