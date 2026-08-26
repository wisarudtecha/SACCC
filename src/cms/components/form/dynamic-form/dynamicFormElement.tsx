import { FormFieldWithChildren, IndividualFormFieldWithChildren } from "@/cms/components/interface/FormField";
import Button from "@/core/components/ui/button/Button";
import { Dropdown } from "@/core/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/core/components/ui/dropdown/DropdownItem";
import { useSortable, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Settings, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "@/core/hooks/useTranslation.ts"; // Import useTranslation

import { formConfigurations, maxGridCol } from "./constant";
import { CSS } from '@dnd-kit/utilities';
import { getColSpanPercentage, getResponsiveColSpanClass, getResponsiveGridClass, updateFieldRecursively } from "./function";
import Input from "@/core/components/form/input/InputField";
import RenderFormField from "./renderFormField";
import { DEFAULT_PII_CLASS, PII_CLASS_KEYS, buildPiiRule, classKeyForRule, isPiiEligibleFieldType, presetsForFieldType, presetKeyForRule } from "./piiPresets";
import type { PiiClassKey, PiiPresetKey } from "./piiPresets";
import type { PiiRule } from "@/core/security/piiFields";

interface FieldEditItemProps {
    field: IndividualFormFieldWithChildren;
    handleLabelChange: (id: string, newLabel: string) => void;
    handleShowLabelChange: (id: string, showLabel: boolean) => void;
    updateFieldId: (oldId: string, newId: string) => void;
    handleAddOption: (id: string, newOptionText: string) => void;
    handleRemoveOption: (fieldId: string, optionIndexToRemove: number) => void;
    removeField: (id: string) => void;
    handleToggleRequired: (id: string) => void;
    handleUpdatePii: (id: string, pii: PiiRule | undefined) => void;
    handlePlaceholderChange: (id: string, newPlaceholder: string) => void;
    handleColSpanChange: (id: string, newColSpan: number) => void;
    overallFormColSpan: number;
    handleChildContainerColSpanChange: (e: React.ChangeEvent<HTMLInputElement>, containerId: string, containerType: "InputGroup" | "dynamicField") => void;
    addField: (formType: string, parentId?: string) => void;
    addFieldToDynamicOption: (dynamicFieldId: string, optionValue: string, formType: string) => void;
    editFormData: boolean;
    isHidden: boolean;
    toggleCardVisibility: (id: string) => void;
    settingHandling: (field: IndividualFormFieldWithChildren) => void;
    setCurrentForm: React.Dispatch<React.SetStateAction<FormFieldWithChildren>>;
    expandedDynamicFields: Record<string, boolean>;
    setExpandedDynamicFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    hiddenCardIds: Set<string>;
    showValidationErrors: boolean;
}

export const SortableFieldEditItem: React.FC<FieldEditItemProps> = React.memo(({
    field,
    handleLabelChange,
    handleShowLabelChange,
    updateFieldId,
    handleAddOption,
    handleRemoveOption,
    removeField,
    handleToggleRequired,
    handleUpdatePii,
    handlePlaceholderChange,
    handleColSpanChange,
    overallFormColSpan,
    handleChildContainerColSpanChange,
    addField,
    addFieldToDynamicOption,
    editFormData,
    isHidden,
    toggleCardVisibility,
    settingHandling,
    setCurrentForm,
    expandedDynamicFields,
    hiddenCardIds,
    setExpandedDynamicFields,
    showValidationErrors,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isOver,
        setActivatorNodeRef
    } = useSortable({ id: field.id });
    const { t } = useTranslation(); // Initialize t function

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isOver ? 0.5 : 1,
    };

    const [isAddDropdownOpen, setAddDropdownOpen] = useState(false);
    const [dynamicOptionDropdown, setDynamicOptionDropdown] = useState<Record<string, boolean>>({});
    const [localIdValue, setLocalIdValue] = useState(field.id);
    const [localLabelValue, setLocalLabelValue] = useState(field.label);
    const [localPlaceholderValue, setLocalPlaceholderValue] = useState(field.placeholder || "");
    const [localNewOptionText, setLocalNewOptionText] = useState("");
    const [localGroupColSpan, setLocalGroupColSpan] = useState(field.GroupColSpan || 1);
    const [localDynamicFieldColSpan, setLocalDynamicFieldColSpan] = useState(field.DynamicFieldColSpan || 1);
    const idInputRef = useRef<HTMLInputElement>(null);
    const labelInputRef = useRef<HTMLInputElement>(null);
    const placeholderInputRef = useRef<HTMLInputElement>(null);

    const toggleDynamicFieldExpansion = (optionValue: string) => {
        setExpandedDynamicFields(prev => ({ ...prev, [`${field.id}-${optionValue}`]: !prev[`${field.id}-${optionValue}`] }));
    };

    useEffect(() => { setLocalIdValue(field.id); }, [field.id]);
    useEffect(() => { setLocalLabelValue(field.label); }, [field.label]);
    useEffect(() => { setLocalPlaceholderValue(field.placeholder || ""); }, [field.placeholder]);
    useEffect(() => { setLocalGroupColSpan(field.GroupColSpan || 1); }, [field.GroupColSpan]);
    useEffect(() => { setLocalDynamicFieldColSpan(field.DynamicFieldColSpan || 1); }, [field.DynamicFieldColSpan]);

    const handleLocalIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setLocalIdValue(e.target.value); }, []);
    const handleIdBlur = useCallback(() => { if (localIdValue !== field.id) { updateFieldId(field.id, localIdValue); } }, [localIdValue, field.id, updateFieldId]);
    const handleIdKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handleIdBlur(); idInputRef.current?.blur(); } }, [localIdValue, field.id, updateFieldId, handleIdBlur]);

    const handleLocalLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setLocalLabelValue(e.target.value); }, []);
    const handleLabelBlur = useCallback(() => { if (localLabelValue !== field.label) { handleLabelChange(field.id, localLabelValue); } }, [localLabelValue, field.id, handleLabelChange]);
    const handleLabelKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handleLabelBlur(); labelInputRef.current?.blur(); } }, [localLabelValue, field.id, handleLabelChange, handleLabelBlur]);

    const handleLocalPlaceholderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { setLocalPlaceholderValue(e.target.value); }, []);
    const handlePlaceholderBlur = useCallback(() => { if (localPlaceholderValue !== field.placeholder) { handlePlaceholderChange(field.id, localPlaceholderValue); } }, [localPlaceholderValue, field.id, handlePlaceholderChange]);
    const handlePlaceholderKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handlePlaceholderBlur(); placeholderInputRef.current?.blur(); } }, [localPlaceholderValue, field.id, handlePlaceholderChange, handlePlaceholderBlur]);

    const handleAddOptionClick = useCallback(() => {
        const trimmedOption = localNewOptionText.trim();
        if (trimmedOption !== "") {
            handleAddOption(field.id, trimmedOption);
            setLocalNewOptionText("");
        }
    }, [localNewOptionText, field.id, handleAddOption]);

    const handleNewOptionKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOptionClick(); } }, [handleAddOptionClick]);

    const handleLocalGroupColSpanChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalGroupColSpan(parseInt(e.target.value, 10));
        handleChildContainerColSpanChange(e, field.id, "InputGroup");
    }, [field.id, handleChildContainerColSpanChange]);

    const handleLocalDynamicFieldColSpanChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalDynamicFieldColSpan(parseInt(e.target.value, 10));
        handleChildContainerColSpanChange(e, field.id, "dynamicField");
    }, [field.id, handleChildContainerColSpanChange]);

    const showPlaceholderInput = ["textInput", "Integer", "select", "dynamicField", "textAreaInput", "emailInput", "passwordInput"].includes(field.type);
    const colSpanOptions = Array.from({ length: overallFormColSpan }, (_, i) => i + 1);
    const isInputGroup = field.type === "InputGroup";
    const isDynamicField = field.type === "dynamicField";
    const childFormFields = formConfigurations.filter(f => f.canBeChild);
    const isAnyDropdownOpen = isAddDropdownOpen || Object.values(dynamicOptionDropdown).some(Boolean);

    const config = formConfigurations.find(c => c.formType === field.type);
    const hasSettings = config && config.property && config.property.length > 0;

    const handleToggleEnableSearch = useCallback((id: string) => {
        setCurrentForm(prevForm => ({
            ...prevForm,
            formFieldJson: updateFieldRecursively(prevForm.formFieldJson, id, (field) => ({
                ...field,
                enableSearch: !field.enableSearch
            })),
        }));
    }, [setCurrentForm]); // Removed updateFieldRecursively from dep array as it's a stable import



    return (
        <div
            ref={setNodeRef} style={style}
            className={`mb-6 h-full border-2 rounded-lg bg-gray-50 relative dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 transition-all duration-300 ${isAnyDropdownOpen ? 'z-20' : 'z-auto'} ${isHidden ? 'p-2' : 'p-4'}`}
            {...attributes}
        >
            <div className="flex items-start justify-between flex-wrap gap-y-2">
                <div
                    ref={setActivatorNodeRef}
                    className="p-1 cursor-grab text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 -ml-1"
                    title={t("formElement.dragHandleTitle")}
                    {...listeners}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </div>
                <div className="flex items-center gap-2">
                    {hasSettings && (
                        <Settings onClick={() => settingHandling(field)} className="cursor-pointer text-gray-400 hover:text-blue-500" size={18} />
                    )}
                    <Button onClick={() => toggleCardVisibility(field.id)} size="xxs" variant="ghost" className="p-1" title={t("formElement.toggleVisibility")}>
                        {isHidden ? <ChevronDownIcon size={18} /> : <ChevronUpIcon size={18} />}
                    </Button>
                    <Button onClick={() => removeField(field.id)} className="p-1 bg-red-500 text-white rounded-full text-xs leading-none w-6 h-6 flex items-center justify-center hover:bg-red-600 transition duration-300" title={t("formElement.removeFieldTitle")} disabled={!editFormData} size="xxs">
                        ✕
                    </Button>
                </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-auto custom-scrollbar ${isHidden ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100 mt-2'}`}>
                <div className="space-y-4">
                    <h1 className="my-px font-mono text-xs">({field.type})</h1>

                    <div className="space-y-2">
                        <div className="flex items-center">
                            <input
                                id={`showLabel-toggle-${field.id}`}
                                type="checkbox"
                                checked={field.showLabel}
                                onChange={(e) => handleShowLabelChange(field.id, e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                disabled={!editFormData}
                            />
                            <label htmlFor={`showLabel-toggle-${field.id}`} className="ml-2 text-gray-700 text-sm font-bold dark:text-gray-400">{t("formElement.showLabel")}</label>
                        </div>
                        {field.showLabel && (
                            <label className="block text-gray-700 text-sm dark:text-gray-400">
                                {t("formElement.labelText")}
                                <Input
                                    ref={labelInputRef}
                                    type="text"
                                    value={localLabelValue}
                                    onChange={handleLocalLabelChange}
                                    onBlur={handleLabelBlur}
                                    onKeyDown={handleLabelKeyDown}
                                    className="mt-1 block w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 dark:text-gray-400"
                                    aria-label={t("formElement.labelPlaceholder")}
                                    disabled={!editFormData}
                                />
                            </label>
                        )}
                    </div>

                    <label className="block text-gray-700 text-sm font-bold dark:text-gray-400">{t("formElement.idLabel")}
                        <Input ref={idInputRef} type="text" value={localIdValue} onChange={handleLocalIdChange} onBlur={handleIdBlur} onKeyDown={handleIdKeyDown} className="mt-1 block w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 dark:text-gray-400" aria-label={t("formElement.idPlaceholder")} title={t("formElement.idTitle")} disabled={true} />
                    </label>

                    {showPlaceholderInput && (
                        <label className="block text-gray-700 text-sm font-bold dark:text-gray-400">{t("formElement.placeholderLabel")}
                            <Input ref={placeholderInputRef} type="text" value={localPlaceholderValue} onChange={handleLocalPlaceholderChange} onBlur={handlePlaceholderBlur} onKeyDown={handlePlaceholderKeyDown} className="mt-1 block w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 dark:text-gray-400" aria-label={t("formElement.placeholderPlaceholder")} title={t("formElement.placeholderTitle")} disabled={!editFormData} />
                        </label>
                    )}

                    <div className="flex items-center">
                        <input type="checkbox" id={`required-${field.id}`} checked={field.required} onChange={() => handleToggleRequired(field.id)} className="form-checkbox h-4 w-4 text-blue-600 rounded" disabled={!editFormData} />
                        <label htmlFor={`required-${field.id}`} className="ml-2 text-gray-700 text-sm dark:text-gray-400">{t("formElement.required")}</label>
                    </div>

                    {isPiiEligibleFieldType(field.type) && (
                        <div className="space-y-1">
                            <div className="flex items-center">
                                <input
                                    id={`pii-toggle-${field.id}`}
                                    type="checkbox"
                                    checked={!!field.pii}
                                    onChange={(e) => {
                                        if (!e.target.checked) {
                                            handleUpdatePii(field.id, undefined);
                                            return;
                                        }
                                        const defaultKey = presetsForFieldType(field.type)[0];
                                        handleUpdatePii(field.id, buildPiiRule(defaultKey, DEFAULT_PII_CLASS));
                                    }}
                                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                    disabled={!editFormData}
                                />
                                <label htmlFor={`pii-toggle-${field.id}`} className="ml-2 text-gray-700 text-sm dark:text-gray-400">{t("formElement.containsPersonalData")}</label>
                            </div>
                            {/* Both dropdowns rebuild the whole rule, since a marker is only
                                meaningful as a strategy and a class together. `classKeyForRule`
                                falls back to the default, so a marker saved before classes
                                existed keeps working rather than writing `undefined` here. */}
                            {field.pii && (
                                <div className="flex flex-wrap gap-2">
                                    <select
                                        id={`pii-strategy-${field.id}`}
                                        value={presetKeyForRule(field.pii)}
                                        onChange={(e) => handleUpdatePii(field.id, buildPiiRule(e.target.value as PiiPresetKey, classKeyForRule(field.pii)))}
                                        className="py-1 px-2 border rounded-md text-gray-700 dark:bg-gray-800 dark:text-gray-400 text-sm"
                                        disabled={!editFormData}
                                    >
                                        {presetsForFieldType(field.type).map((key) => (
                                            <option key={key} value={key}>{t(`formElement.piiStrategy.${key}`)}</option>
                                        ))}
                                    </select>
                                    <select
                                        id={`pii-class-${field.id}`}
                                        value={classKeyForRule(field.pii)}
                                        onChange={(e) => handleUpdatePii(field.id, buildPiiRule(presetKeyForRule(field.pii) || presetsForFieldType(field.type)[0], e.target.value as PiiClassKey))}
                                        className="py-1 px-2 border rounded-md text-gray-700 dark:bg-gray-800 dark:text-gray-400 text-sm"
                                        disabled={!editFormData}
                                        title={t("formElement.piiClass.label")}
                                    >
                                        {PII_CLASS_KEYS.map((key) => (
                                            <option key={key} value={key}>{t(`formElement.piiClass.${key}`)}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {["select", "dynamicField"].includes(field.type) && (
                        <div className="flex items-center">
                            <input
                                id={`enableSearch-toggle-${field.id}`}
                                type="checkbox"
                                checked={!!field.enableSearch}
                                onChange={() => handleToggleEnableSearch(field.id)}
                                className="form-checkbox h-4 w-4 text-blue-600 rounded"
                                disabled={!editFormData}
                            />
                            <label htmlFor={`enableSearch-toggle-${field.id}`} className="ml-2 text-gray-700 text-sm dark:text-gray-400">{t("formElement.enableSearch")}</label>
                        </div>
                    )}



                    <div className="space-y-2 bottom-0">
                        {(isInputGroup || isDynamicField) && !field.isChild && (
                            <div className="flex flex-wrap items-center gap-2">
                                <label htmlFor={`overallColSpan-input-${field.id}`} className="text-gray-700 text-sm dark:text-gray-400">
                                    {t("formElement.gridColumns")}
                                </label>
                                <Input id={`overallColSpan-input-${field.id}`} type="number" min="1" max={maxGridCol.toString()} value={isInputGroup ? localGroupColSpan : localDynamicFieldColSpan} onChange={isInputGroup ? handleLocalGroupColSpanChange : handleLocalDynamicFieldColSpanChange} className="py-1 px-2 border rounded-md text-gray-700 dark:bg-gray-800 dark:text-gray-400 w-20" disabled={!editFormData} />
                            </div>
                        )}
                        <div className={`flex flex-wrap items-center gap-2`}>
                            <label htmlFor={`colSpan-select-${field.id}`} className="text-gray-700 text-sm dark:text-gray-400">{t("formElement.columnSpan")}</label>
                            <select id={`colSpan-select-${field.id}`} value={field.colSpan || 1} onChange={(e) => handleColSpanChange(field.id, parseInt(e.target.value))} className="py-1 px-2 border rounded-md text-gray-700 dark:bg-gray-800 dark:text-gray-400" disabled={!editFormData}>
                                {colSpanOptions.map((span) => (
                                    <option key={span} value={span}>
                                        {getColSpanPercentage(span, overallFormColSpan)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {(field.type === "select" || field.type === "option" || field.type === "radio" || isDynamicField) && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                                <Input type="text" placeholder={t("formElement.newOption")} value={localNewOptionText} onChange={(e) => setLocalNewOptionText(e.target.value)} onKeyDown={handleNewOptionKeyDown} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm dark:text-gray-400" disabled={!editFormData} />
                                <Button onClick={handleAddOptionClick} className="  bg-green-500 text-white  rounded-4xl hover:bg-green-600 disabled:opacity-50 !text-xl flex-shrink-0" disabled={!editFormData} size="xxs">+</Button>
                            </div>

                            {field.options && field.options.map((option, index) => {
                                const optionValue = isDynamicField ? option.value : option;
                                const isExpanded = !!expandedDynamicFields[`${field.id}-${optionValue}`];
                                const isOptionDropdownOpen = !!dynamicOptionDropdown[optionValue];

                                return (
                                    <div key={optionValue} className="flex flex-col gap-2 mt-2 border-t-2
                                    dark:border-gray-600 pt-2">
                                        <div className="flex justify-between items-center flex-wrap gap-2">
                                            <div className="flex space-x-3">
                                                {isDynamicField &&
                                                    <div>
                                                        {isExpanded ? <ChevronUpIcon className="w-4 h-6" onClick={() => toggleDynamicFieldExpansion(optionValue)} /> : <ChevronDownIcon className="w-4 h-6" onClick={() => toggleDynamicFieldExpansion(optionValue)} />}
                                                    </div>}
                                                <p className="text-gray-700 dark:text-white break-all">{optionValue}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {isDynamicField && <div className="">
                                                    <Button className="dropdown-toggle" size="sm" onClick={() => setDynamicOptionDropdown(prev => ({ ...prev, [optionValue]: !prev[optionValue] }))}>{t("common.addField")}</Button>
                                                    <Dropdown className="right-1 overflow-auto max-h-96 custom-scrollbar" isOpen={isOptionDropdownOpen} onClose={() => setDynamicOptionDropdown(prev => ({ ...prev, [optionValue]: false }))}>
                                                        {childFormFields.map(formItem => (<DropdownItem className="text-gray-700 text-sm dark:text-gray-400" key={formItem.formType} onClick={() => { addFieldToDynamicOption(field.id, optionValue, formItem.formType); setDynamicOptionDropdown(prev => ({ ...prev, [optionValue]: false })); }}>{t(formItem.title)}</DropdownItem>))}
                                                    </Dropdown>
                                                </div>}
                                                {/* {isDynamicField && (<Button onClick={() => toggleDynamicFieldExpansion(optionValue)} className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs">{isExpanded ? t("common.hide") : t("common.show")}</Button>)} */}
                                                <Button onClick={() => handleRemoveOption(field.id, index)} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 text-sm" disabled={!editFormData} size="sm">-</Button>
                                            </div>
                                        </div>
                                        {isDynamicField && isExpanded && (
                                            <div className="mt-2 p-3 rounded-md">
                                                {/* <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                                                    <h4 className="text-sm font-semibold dark:text-gray-400">{t("formElement.formForOption", { optionValue: optionValue })}</h4>
                                                    <div className="">
                                                        <Button className="dropdown-toggle" size="sm" onClick={() => setDynamicOptionDropdown(prev => ({ ...prev, [optionValue]: !prev[optionValue] }))}>{t("common.addField")}</Button>
                                                        <Dropdown isOpen={isOptionDropdownOpen} onClose={() => setDynamicOptionDropdown(prev => ({ ...prev, [optionValue]: false }))}>
                                                            {childFormFields.map(formItem => (<DropdownItem className="text-gray-700 text-sm dark:text-gray-400" key={formItem.formType} onClick={() => { addFieldToDynamicOption(field.id, optionValue, formItem.formType); setDynamicOptionDropdown(prev => ({ ...prev, [optionValue]: false })); }}>{formItem.title}</DropdownItem>))}
                                                        </Dropdown>
                                                    </div>
                                                </div> */}
                                                <SortableContext items={(option.form || []).map((f: IndividualFormFieldWithChildren) => f.id)} strategy={rectSortingStrategy}>
                                                    <div className={`grid grid-cols-1 ${getResponsiveGridClass(field.DynamicFieldColSpan)} gap-4`}>
                                                        {(option.form || []).map((childField: IndividualFormFieldWithChildren) => (<div className={getResponsiveColSpanClass(childField.colSpan)} key={childField.id}>
                                                            <SortableFieldEditItem key={childField.id} field={childField} handleLabelChange={handleLabelChange} handleShowLabelChange={handleShowLabelChange} updateFieldId={updateFieldId} handleAddOption={handleAddOption} handleRemoveOption={handleRemoveOption} removeField={removeField} handleToggleRequired={handleToggleRequired} handleUpdatePii={handleUpdatePii} handlePlaceholderChange={handlePlaceholderChange} handleColSpanChange={handleColSpanChange} overallFormColSpan={field.DynamicFieldColSpan || 1} addField={addField} addFieldToDynamicOption={addFieldToDynamicOption} editFormData={editFormData} handleChildContainerColSpanChange={handleChildContainerColSpanChange} isHidden={hiddenCardIds.has(childField.id)} toggleCardVisibility={toggleCardVisibility} settingHandling={settingHandling}
                                                                expandedDynamicFields={expandedDynamicFields} setExpandedDynamicFields={setExpandedDynamicFields} hiddenCardIds={hiddenCardIds} setCurrentForm={setCurrentForm} showValidationErrors={showValidationErrors} />
                                                        </div>))}
                                                    </div>
                                                </SortableContext>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {isInputGroup && (
                        <div className="mt-4 p-3 border-2 border-gray-300 rounded-md bg-gray-100 dark:border-gray-600 dark:bg-gray-800">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 gap-2">
                                <h3 className="text-md font-semibold dark:text-gray-400">{t("formElement.groupedFields")}</h3>
                                <div className="">
                                    <Button className="dropdown-toggle" size="sm" onClick={() => setAddDropdownOpen(prev => !prev)}>{t("common.addField")}</Button>
                                    <Dropdown isOpen={isAddDropdownOpen} onClose={() => setAddDropdownOpen(false)}>
                                        {childFormFields.map(item => (<DropdownItem key={item.formType} className="text-gray-700 text-sm dark:text-gray-400"
                                            onClick={() => { addField(item.formType, field.id); setAddDropdownOpen(false); }}>{t(item.title)}</DropdownItem>))}
                                    </Dropdown>
                                </div>
                            </div>
                            <SortableContext items={Array.isArray(field.value) ? field.value.map((f: IndividualFormFieldWithChildren) => f.id) : []} strategy={rectSortingStrategy}>
                                <div className={`grid grid-cols-1 ${getResponsiveGridClass(field.GroupColSpan)} gap-4`}>
                                    {Array.isArray(field.value) && field.value.map((childField: IndividualFormFieldWithChildren) => (<div className={getResponsiveColSpanClass(childField.colSpan)} key={childField.id}>
                                        <SortableFieldEditItem key={childField.id} field={childField} handleLabelChange={handleLabelChange} handleShowLabelChange={handleShowLabelChange} updateFieldId={updateFieldId} handleAddOption={handleAddOption} handleRemoveOption={handleRemoveOption} removeField={removeField} handleToggleRequired={handleToggleRequired} handleUpdatePii={handleUpdatePii} handlePlaceholderChange={handlePlaceholderChange} handleColSpanChange={handleColSpanChange} overallFormColSpan={field.GroupColSpan || 1} addField={addField} addFieldToDynamicOption={addFieldToDynamicOption} editFormData={editFormData} handleChildContainerColSpanChange={handleChildContainerColSpanChange} isHidden={hiddenCardIds.has(childField.id)} toggleCardVisibility={toggleCardVisibility} settingHandling={settingHandling}
                                            expandedDynamicFields={expandedDynamicFields} setExpandedDynamicFields={setExpandedDynamicFields} hiddenCardIds={hiddenCardIds} setCurrentForm={setCurrentForm}
                                            showValidationErrors={showValidationErrors} />
                                    </div>))}
                                </div>
                            </SortableContext>
                        </div>
                    )}
                </div>
            </div>
            {isHidden && (
                <div className=" items-center justify-between gap-2 py-2">
                    <div className=" items-center gap-3">
                        {/* <span className="text-blue-500 dark:text-blue-300 text-xl flex-shrink-0">{formTypeIcons[field.type] || <span className="text-sm">?</span>}</span>
                        <span className="text-gray-700 dark:text-gray-400 text-lg font-semibold truncate">{field.label}</span> */}
                        <RenderFormField
                            setCurrentForm={setCurrentForm}
                            field={field}
                            editFormData={false}
                            showValidationErrors={showValidationErrors}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});