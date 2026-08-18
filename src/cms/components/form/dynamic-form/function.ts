import { FormConfigItem, FormField, FormFieldWithChildren, IndividualFormFieldWithChildren } from "@/cms/components/interface/FormField";
import { colSpanClasses, gridColumnContainerClasses, maxGridCol } from "./constant";
import { v4 } from "uuid";

export const getColSpanPercentage = (span: number, totalColumns: number = maxGridCol) => {
    if (span <= 0 || totalColumns <= 0) return '0%';
    return `${((span / totalColumns) * 100).toFixed(0)}%`;
};

export const getResponsiveGridClass = (cols: number | undefined,) => {

    return gridColumnContainerClasses[cols ?? 1];
};


export const getResponsiveColSpanClass = (span: number | undefined) => {

    return colSpanClasses[span ?? 1];
};


export const updateFieldRecursively = (
    fields: IndividualFormFieldWithChildren[],
    idToUpdate: string,
    callback: (field: IndividualFormFieldWithChildren) => IndividualFormFieldWithChildren
): IndividualFormFieldWithChildren[] => {
    return fields.map(field => {
        if (field.id === idToUpdate) {
            return callback(field);
        }
        if (field.type === "InputGroup" && Array.isArray(field.value)) {
            return { ...field, value: updateFieldRecursively(field.value, idToUpdate, callback) };
        }
        if (field.type === "dynamicField" && Array.isArray(field.options)) {
            return {
                ...field,
                options: field.options.map(option => ({
                    ...option,
                    form: Array.isArray(option.form) ? updateFieldRecursively(option.form, idToUpdate, callback) : []
                }))
            };
        }
        return field;
    });
};

export const removeFieldRecursively = (
    fields: IndividualFormFieldWithChildren[],
    idToRemove: string
): IndividualFormFieldWithChildren[] => {
    const filteredFields = fields.filter(field => field.id !== idToRemove);

    return filteredFields.map(field => {
        if (field.type === "InputGroup" && Array.isArray(field.value)) {
            return { ...field, value: removeFieldRecursively(field.value, idToRemove) };
        }
        if (field.type === "dynamicField" && Array.isArray(field.options)) {
            return {
                ...field,
                options: field.options.map(option => ({
                    ...option,
                    form: Array.isArray(option.form) ? removeFieldRecursively(option.form, idToRemove) : []
                }))
            };
        }
        return field;
    });
};


export function createDynamicFormField(
    config: FormConfigItem[],
    typeToInsert: string,
    isChild: boolean = false
): IndividualFormFieldWithChildren | undefined {
    const configItem = config.find((item) => item.formType === typeToInsert);

    if (!configItem) {
        return undefined;
    }
    if (isChild && !configItem.canBeChild) {
        console.warn(`Cannot add a "${configItem.title}" inside a group.`);
        return undefined;
    }

    const id = v4();

    let defaultValue: any;
    let fieldOptions: any[] | undefined;
    let newOptionText: string | undefined;
    let placeholder: string | undefined;
    let GroupColSpan: number | undefined;
    let DynamicFieldColSpan: number | undefined;
    let enableSearch: boolean | undefined;


    if (configItem.formType === "InputGroup") {
        defaultValue = [];
        GroupColSpan = 1;
    } else if (configItem.formType === "dynamicField") {
        defaultValue = "";
        DynamicFieldColSpan = 1;
    } else if (configItem.formType === "option") {
        defaultValue = [];
    } else if (configItem.formType === "Integer") {
        defaultValue = null;
    } else if (configItem.formType === "multiImage" || configItem.formType === "dndMultiImage") {
        defaultValue = [];
    } else if (configItem.formType === "phoneNumber") {
        defaultValue = ""
    } else if (configItem.formType === "image" || configItem.formType === "dndImage") {
        defaultValue = null;
    } else {
        defaultValue = "";
    }

    if (configItem.formType === "option" || configItem.formType === "select" || configItem.formType === "radio" || configItem.formType === "dynamicField") {
        fieldOptions = configItem.options || [];
        newOptionText = "";
    }

    if (["select", "dynamicField"].includes(configItem.formType)) {
        enableSearch = false;
    }


    return {
        id: id,
        label: configItem.title,
        type: configItem.formType,
        showLabel: true,
        value: defaultValue,
        ...(enableSearch !== undefined && { enableSearch }),
        ...(fieldOptions && { options: fieldOptions }),
        ...(newOptionText !== undefined && { newOptionText: newOptionText }),
        ...(placeholder && { placeholder: placeholder }),
        required: false,
        colSpan: 1,
        isChild: isChild,
        ...(GroupColSpan !== undefined && { GroupColSpan: GroupColSpan }),
        ...(DynamicFieldColSpan !== undefined && { DynamicFieldColSpan: DynamicFieldColSpan }),
        formRule: {},
    };
}


export function isFormFieldWithChildren(
    formField: FormField | FormFieldWithChildren
): formField is FormFieldWithChildren {
    if (!formField.formFieldJson || !Array.isArray(formField.formFieldJson)) {
        return false;
    }
    return true
}