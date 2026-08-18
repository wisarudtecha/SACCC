import React from 'react';
import { FormField, IndividualFormField } from "@/cms/components/interface/FormField";
import { useTranslation } from "@/core/hooks/useTranslation.ts"; // 1. Import useTranslation
import { usePiiMasker } from "@/core/hooks/useMaskedValue";

interface FormViewerProps {
  formData: FormField;
  disbleRequireElement?:boolean;
  /**
   * Opt-in only. This viewer is shared with case-type forms and SOP answers, which must stay
   * public — only the customer's own dynamic form (`CustomerPreview`) passes `true`.
   */
  maskPii?: boolean;
}

const FormViewer: React.FC<FormViewerProps> = ({ formData ,disbleRequireElement=false, maskPii=false}) => {
  const { t } = useTranslation();
  const { maskDynamicField } = usePiiMasker();

  const renderFieldValue = (field: IndividualFormField) => {
    const valueTextClasses = "text-md font-medium text-gray-900 dark:text-white";
    const labelTextClasses = "text-md text-gray-500 dark:text-gray-400";
    let valueContent: React.ReactNode;

    const renderLabel = (label: string, required?: boolean) => (
      <span className={labelTextClasses}>
        {label}
        {required && !disbleRequireElement && <span className="text-red-500 ml-1">*</span>}
      </span>
    );


    const emptyValueIndicator = t("formViewer.emptyValue"); 

    switch (field.type) {
      case "textInput":
      case "emailInput":
      case "passwordInput":
      case "Integer":
      case "textAreaInput":
      case "dateInput":
      case "dateLocal":
      case "select":
      case "radio": {
        // Coerce to string before masking - `Integer` fields carry a number, and `applyMask`
        // works on strings. Empty/null/undefined pass through both steps unchanged.
        const rawValue = field.value;
        const stringValue = rawValue === null || rawValue === undefined || rawValue === ""
          ? rawValue
          : String(rawValue);
        const displayValue = maskPii ? maskDynamicField(field, stringValue) : stringValue;
        valueContent = displayValue || emptyValueIndicator;
        break;
      }

      case "option": // Multi-checkbox
        valueContent = Array.isArray(field.value) && field.value.length > 0
          ? field.value.join(", ")
          : emptyValueIndicator;
        break;

      case "image":
      case "dndImage":
        const singleImageUrl = field.value instanceof File ? URL.createObjectURL(field.value) : (typeof field.value === 'string' ? field.value : null);
        valueContent = singleImageUrl ? (
          <img src={singleImageUrl} alt={field.label} className="max-w-xs h-auto" />
        ) : (
          t("formViewer.noImageUploaded") 
        );
        break;

      case "multiImage":
      case "dndMultiImage":
        const multiImageFiles = Array.isArray(field.value) ? field.value : [];
        valueContent = multiImageFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {multiImageFiles.map((file: File | { name: string; url: string;[key: string]: any }, index: number) => {
              let imageUrl: string = "";
              if (file instanceof File || file instanceof Blob) {
                imageUrl = URL.createObjectURL(file);
              } else if (typeof file === 'object' && file !== null && 'url' in file && typeof file.url === 'string') {
                imageUrl = file.url;
              } else {
                imageUrl = "";
              }
              return imageUrl ? (
                <img key={`${file.name}-${index}`} src={imageUrl} alt={`${field.label} ${index + 1}`} className="max-w-full h-auto" />
              ) : null;
            })}
          </div>
        ) : (
          t("formViewer.noImagesUploaded")
        );
        break;

      case "InputGroup":
        return (
          <>
            {field.showLabel && (
              <h3 className="text-lg font-semibold mb-3 dark:text-gray-300">
                {renderLabel(field.label, field.required)}
              </h3>
            )}
            {Array.isArray(field.value) && field.value.map((childField: IndividualFormField) => (
              <React.Fragment key={childField.id}>
                {renderFieldValue(childField)}
              </React.Fragment>
            ))}
            {Array.isArray(field.value) && field.value.length === 0 && (
              <p className="text-center text-gray-500 italic text-sm mt-2">{t("formViewer.emptyGroup")}</p> // i18n for empty group
            )}
          </>
        );

      case "dynamicField":
        const selectedOption = field.options?.find((option: any) => option.value === field.value);
        return (
          <>
            {field.showLabel && renderLabel(field.label, field.required)}
            <div className={valueTextClasses}>{field.value || emptyValueIndicator}</div>
            {selectedOption && Array.isArray(selectedOption.form) && selectedOption.form.length > 0 && (
              <>
                <h4 className="text-md font-semibold mb-3 dark:text-gray-300">
                  {t("formViewer.dynamicFieldDetails", { value: field.value })}
                </h4>
                {selectedOption.form.map((nestedField: IndividualFormField) => (
                  <React.Fragment key={nestedField.id}>
                    {renderFieldValue(nestedField)}
                  </React.Fragment>
                ))}
              </>
            )}
          </>
        );

      default:
        valueContent = <p className="text-red-500">{t("formViewer.unsupportedFieldType", { type: field.type })}</p>; // i18n for unsupported type
        break;
    }

    return (
      <div className="mb-2">
        {field.showLabel && renderLabel(field.label, field.required)}
        <div className={valueTextClasses}>&nbsp;&nbsp;&nbsp;&nbsp;{valueContent}</div>
      </div>
    );
  };

  return (
    <div>
      {(formData?.formFieldJson?.length || 0) > 0 ? (
        formData.formFieldJson.map((field) => (
          <React.Fragment key={field.id}>
            {renderFieldValue(field)}
          </React.Fragment>
        ))
      ) : null}
    </div>
  );
};

export default FormViewer;