// src/cms/components/crm/Form.tsx
"use client"

import { useState, useEffect } from "react";
import { CameraIcon, Image, X } from "lucide-react";
import { ToastContainer } from "@/core/components/crud/ToastContainer";
import { useToast } from "@/core/hooks/useToast";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePostUploadFileMutationMutation } from "@/core/store/api/file";
import { formatToLocalInput, getColSpanClass, getFieldGroups, toLocalInputString } from "@/cms/utils/productHelper";
import type { FieldConfig } from "@/cms/types/product";
import Input from "@/core/components/form/input/InputField";
import Label from "@/core/components/form/Label";
import CustomizableSelect from "@/core/components/form/CustomizableSelect";
import Button from "@/core/components/ui/button/Button";
import Select from "@/core/components/form/Select";
import Switch from "@/core/components/form/switch/Switch";
import ImageWithValidation from "@/cms/components/crm/ImageWithValidation";

export interface FormProps<T> {
  cancelLabel?: string;
  customFieldGroup?: string[];
  fields: FieldConfig[];
  initialValues?: Partial<T>;
  loading?: boolean;
  open: boolean;
  submitLabel?: string;
  title: string;
  uploadPath?: string;
  onCancel: () => void;
  onSubmit: (data: T) => void | Promise<void>;
}

const Form = <T extends Record<string, unknown>>({
  cancelLabel = "Cancel",
  customFieldGroup = ["th", "en"],
  fields,
  initialValues,
  loading = false,
  open,
  submitLabel = "Submit",
  title,
  uploadPath,
  onCancel,
  onSubmit
}: FormProps<T>) => {
  const [fileUploader] = usePostUploadFileMutationMutation();
  const { toasts, addToast, removeToast } = useToast();
  const { t } = useTranslation();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<T>>(initialValues || {});
  const [previews, setPreviews] = useState<Record<string, string>>({});

  // v2.0 - Handle datetime-local formatting for both initial values and form submission
  // const datetimeFields = fields.filter(f => f.type === "datetime-local");

  // v4.0 - Reset form data and previews when the form is closed
  useEffect(() => {
    if (!open) {
      return;
    }
    const updated: Record<string, unknown> = {};
    const now = new Date();
    const formattedNow = formatToLocalInput(now);
    fields.forEach(field => {
      if (field.type === "datetime-local") {
        const val = initialValues?.[field.name];
        updated[field.name] = val
          ? toLocalInputString(val as string)
          : formattedNow;
      }
      else if (initialValues?.[field.name] !== undefined) {
        updated[field.name] = initialValues[field.name];
      }
      else {
        updated[field.name] = field.multiple ? [] : "";
      }
    });
    setFormData(updated as Partial<T>);
    setPreviews({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // v3.0 - Combined approach for initial values and datetime formatting
  // useEffect(() => {
  //   const updated: Record<string, unknown> = {};
  //   const now = new Date();
  //   const formattedNow = formatToLocalInput(now);
  //   fields.forEach(field => {
  //     if (field.type === "datetime-local") {
  //       const val = initialValues?.[field.name];
  //       if (val) {
  //         updated[field.name] = toLocalInputString(val as string);
  //       }
  //       else {
  //         updated[field.name] = formattedNow; // real default
  //       }
  //     }
  //     else if (initialValues?.[field.name] !== undefined) {
  //       updated[field.name] = initialValues[field.name];
  //     }
  //   });
  //   setFormData(updated as Partial<T>);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   initialValues,
  //   // fields
  // ]);

  // v2.0 - Handle datetime-local formatting for both initial values and form submission
  // useEffect(() => {
  //   if (initialValues) {
  //     console.log(initialValues);
  //     const updated: Record<string, unknown> = { ...initialValues };
  //     datetimeFields.forEach(field => {
  //       const val = initialValues[field.name];
  //       if (val) {
  //         updated[field.name] = formatToLocalInput(val as string | Date);
  //       }
  //     });
  //     setFormData(updated as Partial<T>);
  //     // console.log(updated);
  //   }
  //   else {
  //     // create mode (optional default)
  //     const now = new Date();
  //     const formatted = formatToLocalInput(now);
  //     const defaults: Record<string, unknown> = {};
  //     datetimeFields.forEach(field => {
  //       defaults[field.name] = formatted;
  //     });
  //     setFormData(prev => ({
  //       ...prev,
  //       ...defaults,
  //     }));
  //   }
  // }, [initialValues, fields, datetimeFields]);

  // v1.0 - Fetch data for select options or other dynamic fields when the form opens
  // useEffect(() => {
  //   if (initialValues) {
  //     setFormData(initialValues);
  //   }
  // }, [initialValues]);

  if (!open) {
    return null;
  }

  const handleChange = (name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error of current field
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });

    // Handle file preview
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviews(prev => ({ ...prev, [name]: url }));
    }
    else if (value === null) {
      setPreviews(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmpty = (val: unknown) => val === undefined || val === null || val === "";

    // Validation
    // v3.0 - Validate required fields individually
    const validationErrors: Record<string, string> = {};
    const validationErrorsToast: Record<string, string> = {};
    fields.forEach(field => {
      const value = formData[field.name];
      if (field.required && (isEmpty(value) || value === 0)) {
        validationErrors[field.name] = field.errorMessage || `${field.label} ${t("common.required_field")}`;
        validationErrorsToast[field.name] = field.label;
      }
    });
    // v2.0 - Improved required field validation to handle different types (string, number, file)
    // const missingFields = fields.filter(field => field.required && isEmpty(formData[field.name])).map(field => field.label);
    // v1.0 - Basic required field validation
    // const missingFields = fields.filter(field => field.required && !formData[field.name]).map(field => field.label);

    // v2.0 - Show validation errors for each field instead of a single toast message
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      if (Object.keys(validationErrorsToast).length > 0) {
        addToast("error", `${t("common.required_field")}: ${Object.values(validationErrorsToast).join(", ")}`);
      }
      return;
    }
    // v1.0 - Show a single toast message for missing required fields
    // if (missingFields.length > 0) {
    //   addToast("error", `${t("common.required_field")}: ${missingFields.join(", ")}`);
    //   return;
    // }

    const fileField = fields.find(f => f.type === "file");
    const selectedFile = fileField ? formData[fileField.name] : null;

    if (selectedFile instanceof File && uploadPath) {
      // v2.0 - A rejected upload used to escape handleSubmit entirely: no toast, no aborted
      // submit. Falling through to onSubmit is worse than failing - the record would save with
      // the previous image blanked out - so the submit stops here instead.
      try {
        const uploadResponse = await fileUploader({ file: selectedFile, path: uploadPath }).unwrap();
        if (uploadResponse?.data) {
          (formData as unknown as Record<string, unknown>).image = uploadResponse.data?.attUrl || "";
        }
      }
      catch (error: unknown) {
        console.error("Upload error:", error);
        addToast("error", (error as { data?: { message?: string } })?.data?.message || `${t("common.error")}`);
        return;
      }

      // v1.0 - Upload without error handling
      // const uploadResponse = await fileUploader({ file: selectedFile, path: uploadPath }).unwrap();
      // if (uploadResponse?.data) {
      //   (formData as unknown as Record<string, unknown>).image = uploadResponse.data?.attUrl || "";
      // }
    }
    else {
      (formData as unknown as Record<string, unknown>).image = (formData.attachment as { attUrl?: string })?.attUrl || "";
    }

    // v2.0 - Normalize datetime-local fields to UTC ISO format before submission
    // const normalizedData = { ...formData } as Record<string, unknown>;

    // v2.0 - Handle datetime-local formatting for both initial values and form submission
    // fields.forEach(field => {
    //   if (field.type === "datetime-local") {
    //     const val = normalizedData[field.name];
    //     if (val) {
    //       normalizedData[field.name] = toUTCISOString(val as string);
    //     }
    //   }
    // });

    // v1.0 - Basic form submission without datetime normalization
    // datetimeFields.forEach(field => {
    //   const val = normalizedData[field.name];
    //   if (val) {
    //     normalizedData[field.name] = new Date(val as string | number | Date).toISOString();
    //   }
    // });

    try {
      // v2.0 - Normalize datetime-local fields to UTC ISO format before submission
      // await onSubmit(normalizedData as T);

      // v1.0 - Basic form submission without datetime normalization
      await onSubmit(formData as T);
    }
    catch (error: unknown) {
      // v2.0 - Handle API errors and display field-specific error messages
      const apiErrors = (error as { data?: { errors?: Record<string, string> } })?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        setFieldErrors(apiErrors);
      }
      addToast("error", (error as { data?: { message?: string } })?.data?.message || `${t("common.error")}`);

      // v1.0 - Basic error handling without field-specific errors
      // addToast("error", `${t("common.error")}: ${error}`);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name];

    if (field.customRender) {
      return field.customRender(value, val => handleChange(field.name, val), formData);
    }

    switch (field.type) {
      case "customizable-select":
        return (
          <CustomizableSelect
            value={value as string[] | string || ""}
            onChange={val => handleChange(field.name, val)}
            options={field.options || []}
            placeholder={field.placeholder}
            multiple={field.multiple || false}
            key={field.name}
          />
        );
      
      case "datetime-local":
        return (
          <Input
            name={field.name}
            type="datetime-local"
            // value={formatToLocalInput(value as string | Date)} // v2.0 - Handle datetime-local formatting for both initial values and form submission
            value={(value as string) || ""} // v1.0 - Basic datetime-local handling without separate formatting function
            onChange={e => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            // required={field.required}
          />
        );

      case "file":
        return (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6 text-center">
            <div className="relative w-35 h-35 mx-auto mb-4 group">
              {previews[field.name] || (formData[field.name] as { attUrl?: string })?.attUrl ? (
                // v2.0 - Use ImageWithValidation for better handling of image loading and errors
                <ImageWithValidation
                  src={previews[field.name] || (formData[field.name] as { attUrl?: string })?.attUrl}
                  alt="Preview"
                  className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />

                // v1.0 - Basic image preview without validation
                // <img
                //   src={previews[field.name] || (formData[field.name] as { attUrl?: string })?.attUrl}
                //   alt="Preview"
                //   className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                // />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Image className="w-24 h-24 text-gray-300 dark:text-gray-600" />
                </div>
              )}
              
              <label
                htmlFor="photo-upload"
                className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="text-center">
                  <CameraIcon className="w-8 h-8 text-white mx-auto" />
                  <span className="text-xs text-white mt-1">
                    {t("crud.common.form.attachment.placeholder")}
                  </span>
                </div>
              </label>
            </div>

            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  handleChange(field.name, file);
                }
                else {
                  handleChange(field.name, null);
                }
              }}
              className="hidden"
            />

            <p className="text-xs text-gray-500 mt-2">
              {t("crud.common.form.attachment.helper")}
            </p>
          </div>
        );

      case "input-group":
        return (
          <div className="relative">
            <div className="relative">
              <Input
                name={field.name}
                type={field.type}
                value={value as string | number || ""}
                onChange={e => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                // required={field.required}
              />
            </div>
            {/*
            <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Remaining Stock ?
            </span>
            */}
          </div>
        );
      
      case "select":
        return (
          <Select
            value={value as string || ""}
            onChange={val => handleChange(field.name, val)}
            options={field.options || []}
            placeholder={field.placeholder}
          />
        );

      case "toggle": {
        // Switch is uncontrolled - it seeds useState(defaultChecked) and never resyncs - which
        // is only safe because Form is conditionally mounted by its callers ({showForm && <Form/>}),
        // so it remounts with a fresh defaultChecked every time the modal opens.
        // The on/off wording comes from the field's own options, so this stays generic.
        const checked = Boolean(value);
        const stateLabel = field.options?.find(option => String(option.value) === String(checked))?.label ?? "";
        return (
          <Switch
            label={stateLabel}
            defaultChecked={checked}
            onChange={isChecked => handleChange(field.name, isChecked)}
          />
        );
      }

      case "textarea":
        return (
          <textarea
            name={field.name}
            value={value as string || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-black dark:text-white"
            rows={4}
          />
        );

      default:
        return (
          <Input
            name={field.name}
            type={field.type}
            value={value as string | number || ""}
            onChange={e => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            // required={field.required}
          />
        );
    }
  };

  const { imageField, topRightFields, restFields } = getFieldGroups(fields, customFieldGroup);

  return (
    <>
      <div className="fixed inset-0 bg-white/90 dark:bg-black/70 flex items-center justify-center z-9999">
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-9999">
            <h2 className="text-xl font-semibold text-black dark:text-white">{title}</h2>
            
            <button
              onClick={onCancel}
              disabled={loading}
              className={`${loading ? "cursor-not-allowed opacity-50" : ""} text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {imageField ? (
              <div className="p-6 space-y-6">
                {/* ===== TOP SECTION ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* LEFT (IMAGE) */}
                  <div>
                    <Label className="mb-2 block">{imageField.label}</Label>
                    {renderField(imageField)}
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-4">
                    {topRightFields.map(field => (
                      <div key={field.name}>
                        <Label className="mb-2 block">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderField(field)}
                        {fieldErrors[field.name] && (
                          <span className="text-red-500 text-xs mt-1 block cursor-default">
                            {fieldErrors[field.name]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ===== BOTTOM SECTION (DYNAMIC GRID) ===== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restFields.map(field => (
                    <div key={field.name} className={getColSpanClass(field)}>
                      <Label className="mb-2 block">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                      {fieldErrors[field.name] && (
                        <span className="text-red-500 text-xs mt-1 block cursor-default">
                          {fieldErrors[field.name]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(field => (
                    <div
                      key={field.name}
                      className={getColSpanClass(field)}
                    >
                      <Label className="mb-2 block">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                      {fieldErrors[field.name] && (
                        <span className="text-red-500 text-xs mt-1 block cursor-default">
                          {fieldErrors[field.name]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end p-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={loading}
              >
                {loading ? t("crud.common.form.action.saving") : submitLabel}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default Form;
