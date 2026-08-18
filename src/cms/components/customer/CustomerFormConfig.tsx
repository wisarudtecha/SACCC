import React, { useEffect, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useGetCustomerFormConfigQuery, useUpdateCustomerFormConfigMutationMutation } from "@/cms/store/api/custommerApi";
import { CustomerFormConfigType } from "@/cms/types/customer";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import Loading from "@/core/components/common/Loading";
import { Save } from "lucide-react";
import { useGetFormQuery, useGetFormByFormIdQueryQuery } from "@/cms/store/api/formApi";
import { SearchableSelectApi, SearchableSelect } from "@/cms/components/SearchInput/SearchSelectInput";
import DynamicForm from "@/cms/components/form/dynamic-form/DynamicForm";
import { versionListToTextNoEditText } from "../form/dynamic-form/constant";
import { FormField, GetFormResponse } from "@/cms/components/interface/FormField";
import Button from "@/cms/components/ui/button/Button";
import { Modal } from "@/core/components/ui/modal";

const DEFAULT_CONFIG: CustomerFormConfigType = {
    displayName: true,
    title: true,
    firstName: true,
    middleName: true,
    lastName: true,
    citizenId: true,
    dob: true,
    blood: true,
    gender: true,
    mobileNo: true,
    address: {
        building: true,
        country: true,
        district: true,
        floor: true,
        lat: true,
        lon: true,
        no: true,
        postalCode: true,
        province: true,
        road: true,
        room: true,
        street: true,
        subDistrict: true,
    },
    photo: true,
    email: true,
    userType: true,
    note: true,
    languagePreference: true,
    contractPreference: true,
    currentAddress: {
        building: true,
        country: true,
        district: true,
        floor: true,
        lat: true,
        lon: true,
        no: true,
        postalCode: true,
        province: true,
        road: true,
        room: true,
        street: true,
        subDistrict: true,
    },
    dynamicFormEnable: false,
};

// Toggle Switch component
const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: () => void;
    label: string;
    id: string;
}> = ({ checked, onChange, label, id }) => (
    <label
        htmlFor={id}
        className="flex items-center justify-between p-3 rounded-xl cursor-pointer group
      border border-gray-100 dark:border-gray-700/50
      hover:border-blue-200 dark:hover:border-blue-700/50
      hover:bg-blue-50/50 dark:hover:bg-blue-900/10
      transition-all duration-200"
    >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            {label}
        </span>
        <div className="relative shrink-0 ml-3">
            <input
                id={id}
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={onChange}
            />
            <div
                className={`w-11 h-6 rounded-full transition-all duration-300 shadow-inner ${checked
                    ? "bg-blue-500 dark:bg-blue-600"
                    : "bg-gray-200 dark:bg-gray-600"
                    }`}
            />
            <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${checked
                    ? "translate-x-5 bg-white"
                    : "translate-x-0 bg-white"
                    }`}
            />
        </div>
    </label>
);

// Section card component
const SectionCard: React.FC<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6 shadow-sm mb-6">
        <div
            className="text-gray-800 dark:text-white flex items-center justify-between cursor-pointer border-b pb-3 mb-5 dark:border-gray-700 border-gray-200"
            onClick={onToggle}
        >
            <h3 className="font-semibold text-gray-800 dark:text-white">{title}</h3>
            <svg
                className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "" : "-rotate-180"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        </div>
        {isOpen && <div className="space-y-4">{children}</div>}
    </div>
);

const CustomerFormConfig: React.FC = () => {
    const { t } = useTranslation();
    const { addToast } = useToastContext();
    const { data: configData, isLoading } = useGetCustomerFormConfigQuery();
    const [updateConfig, { isLoading: isUpdating }] = useUpdateCustomerFormConfigMutationMutation();
    const [formData, setFormData] = useState<CustomerFormConfigType>(DEFAULT_CONFIG);
    const [sectionsOpen, setSectionsOpen] = useState({
        profile: true,
        personal: true,
        address: true,
        preferences: true,
        specificForm: true,
    });

    const toggleSection = (section: keyof typeof sectionsOpen) => {
        setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
    };


    useEffect(() => {
        if (configData?.data) {
            setFormData({
                ...DEFAULT_CONFIG,
                ...configData.data,
                address: { ...DEFAULT_CONFIG.address, ...(configData.data?.address || {}) },
                currentAddress: { ...DEFAULT_CONFIG.currentAddress, ...(configData.data?.currentAddress || {}) },
                dynamicForm: configData.data?.dynamicForm,
                dynamicFormEnable: configData.data?.dynamicForm ? true : false
            });
        }
    }, [configData]);

    // show/hide form builder modal
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const { data: selectedFormRes } = useGetFormByFormIdQueryQuery(
        {
            formId: formData.dynamicForm?.formId || "",
            version: formData.dynamicForm?.versions || "",
            listVersion: true
        },
        { skip: !formData.dynamicForm?.formId, refetchOnMountOrArgChange: true }
    );

    const handleChangeVersion = (version: string) => {
        setFormData((prev) => ({
            ...prev,
            dynamicForm: prev.dynamicForm ? { ...prev.dynamicForm, versions: version } : undefined
        }));
    };

    const handleToggle = (key: keyof CustomerFormConfigType) => {
        setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleAddressToggle = (type: "address" | "currentAddress", key: keyof CustomerFormConfigType["address"]) => {
        setFormData((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                [key]: !prev[type][key],
            },
        }));
    };

    const handleSave = async () => {
        try {
            await updateConfig(formData).unwrap();
            addToast("success", t("customerConfigure.saveSuccess"));
        } catch {
            addToast("error", t("customerConfigure.saveError"));
        }
    };

    if (isLoading) return <Loading />;

    const personalFields: Array<{ key: keyof CustomerFormConfigType; labelKey: string }> = [
        { key: "photo", labelKey: "photo" },
        { key: "displayName", labelKey: "displayName" },
        { key: "title", labelKey: "title" },
        { key: "firstName", labelKey: "firstName" },
        { key: "middleName", labelKey: "middleName" },
        { key: "lastName", labelKey: "lastName" },
        { key: "citizenId", labelKey: "citizenId" },
        { key: "dob", labelKey: "dob" },
        { key: "blood", labelKey: "blood" },
        { key: "gender", labelKey: "gender" },
    ];

    const contactFields: Array<{ key: keyof CustomerFormConfigType; labelKey: string }> = [
        { key: "userType", labelKey: "userType" },
        { key: "languagePreference", labelKey: "languagePreference" },
        { key: "contractPreference", labelKey: "contractPreference" },
        { key: "social", labelKey: "social" },
        { key: "note", labelKey: "note" },
    ];

    const addressFieldKeys = (Object.keys(DEFAULT_CONFIG.address) as Array<keyof CustomerFormConfigType["address"]>);
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                {/* <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("customerConfigure.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("customerConfigure.subtitle")}
          </p>
        </div> */}

                <div className="xl:col-span-2 space-y-6">
                    {/* Profile Photo */}
                    <SectionCard
                        title={t("userform.profilePhoto")}
                        isOpen={sectionsOpen.profile}
                        onToggle={() => toggleSection("profile")}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ToggleSwitch
                                id="personal-photo"
                                label={t("customerConfigure.fields.photo")}
                                checked={formData.photo as boolean}
                                onChange={() => handleToggle("photo")}
                            />
                        </div>
                    </SectionCard>

                    {/* Personal Information */}
                    <SectionCard
                        title={t("userform.personal")}
                        isOpen={sectionsOpen.personal}
                        onToggle={() => toggleSection("personal")}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {personalFields.filter(f => f.key !== "photo").map(({ key, labelKey }) => (
                                <ToggleSwitch
                                    key={key}
                                    id={`personal-${key}`}
                                    label={t(`customerConfigure.fields.${labelKey}`)}
                                    checked={formData[key] as boolean}
                                    onChange={() => handleToggle(key)}
                                />
                            ))}
                        </div>
                    </SectionCard>

                    {/* Address Information */}
                    <SectionCard
                        title={t("userform.address") || "Address Information"}
                        isOpen={sectionsOpen.address}
                        onToggle={() => toggleSection("address")}
                    >
                        <div className="mb-8">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                {t("address.registered")}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-gray-100 dark:border-gray-700 p-4 rounded-xl">
                                {addressFieldKeys.map((key) => (
                                    <ToggleSwitch
                                        key={key}
                                        id={`address-${key}`}
                                        label={t(`customerConfigure.fields.${key}`)}
                                        checked={formData.address[key]}
                                        onChange={() => handleAddressToggle("address", key)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                {t("address.currentAddress") || "Current Address"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-gray-100 dark:border-gray-700 p-4 rounded-xl">
                                {addressFieldKeys.map((key) => (
                                    <ToggleSwitch
                                        key={key}
                                        id={`currentAddress-${key}`}
                                        label={t(`customerConfigure.fields.${key}`)}
                                        checked={formData.currentAddress[key]}
                                        onChange={() => handleAddressToggle("currentAddress", key)}
                                    />
                                ))}
                            </div>
                        </div>
                    </SectionCard>

                    {/* Preferences */}
                    <SectionCard
                        title={t("userform.preferences") || "Preferences"}
                        isOpen={sectionsOpen.preferences}
                        onToggle={() => toggleSection("preferences")}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {contactFields.map(({ key, labelKey }) => (
                                <ToggleSwitch
                                    key={key}
                                    id={`contact-${key}`}
                                    label={t(`customerConfigure.fields.${labelKey}`)}
                                    checked={formData[key] as boolean}
                                    onChange={() => handleToggle(key)}
                                />
                            ))}
                        </div>
                    </SectionCard>

                    {/* Specific Form Configuration */}
                    <SectionCard
                        title={t("userform.specificForm")}
                        isOpen={sectionsOpen.specificForm}
                        onToggle={() => toggleSection("specificForm")}
                    >
                        <ToggleSwitch
                            id="dynamicForm-enabled"
                            label={t("customerConfigure.fields.dynamicForm")}
                            checked={formData.dynamicFormEnable}
                            onChange={() =>
                                setFormData((prev) => ({
                                    ...prev,
                                    dynamicFormEnable: !prev.dynamicFormEnable,
                                    dynamicForm: !prev.dynamicFormEnable ? prev.dynamicForm : undefined
                                }))
                            }
                        />
                        {formData.dynamicFormEnable && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        {t("userform.specificForm")}
                                    </label>
                                    <div className="flex space-x-3">
                                        <SearchableSelectApi<GetFormResponse>
                                            value={formData.dynamicForm?.formId || ""}
                                            selectedLabelFallback={formData.dynamicForm?.formName}
                                            apiQuery={useGetFormQuery}
                                            queryParams={{ type: "customer" }}
                                            labelKey={"formName"}
                                            valueKey="formId"
                                            enableApiSearch={true}
                                            enablePaginate={true}
                                            className="w-full"
                                            placeholder={`${t("common.select")} ${t("userform.specificForm")}`}
                                            onChangeObject={(opt) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    dynamicForm: opt,
                                                    dynamicFormEnable: true
                                                }));
                                            }}
                                        />
                                        <SearchableSelect
                                            className='w-fit items-end justify-end rounded-full text-xs font-medium'
                                            value={formData.dynamicForm?.versions || selectedFormRes?.data?.versions || ""}
                                            prefixedStringValue="v "
                                            subfixedStringValue=" "
                                            isDynamic={true}
                                            options={versionListToTextNoEditText(
                                                selectedFormRes?.data?.versionsInfoList?.filter(item => item.version === (formData.dynamicForm?.versions || selectedFormRes?.data?.versions) || item.publish === true) || [],
                                                (selectedFormRes?.data?.formId === configData?.data?.dynamicForm?.formId ? configData?.data?.dynamicForm?.versions : "") || ""
                                            ) || []}
                                            onChange={handleChangeVersion}
                                            disabledRemoveButton={true}
                                            disabled={!formData.dynamicForm?.formId}
                                        />
                                        <Button
                                            size="xxs"
                                            variant="warning"
                                            disabled={!formData.dynamicForm?.formId}
                                            onClick={() => {
                                                setIsEditMode(true);
                                                setShowCreateForm(true);
                                            }}
                                        >
                                            {t("common.edit")}
                                        </Button>
                                        <Button
                                            size="xxs"
                                            onClick={() => {
                                                setIsEditMode(false);
                                                setShowCreateForm(true);
                                            }}
                                        >
                                            {t("common.add")}
                                        </Button>
                                    </div>
                                </div>

                                {/* Form Creation Modal */}
                                <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} className="max-w-6xl">
                                    <div className="p-6">
                                        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                            <DynamicForm
                                                initialForm={isEditMode ? selectedFormRes?.data : undefined}
                                                edit={true}
                                                editFormData={true}
                                                enableFormTitle={true}
                                                enableSelfBg={false}
                                                stickyFooter={true}
                                                publishOnSubmit={true}
                                                doFuncAterFormSave={(data: FormField) => {
                                                    if (data.formId) {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            dynamicForm: {
                                                                formId: data.formId,
                                                                formName: data.formName || "",
                                                                versions: data.version ? String(data.version) : "",
                                                                publish: false,
                                                            },
                                                            dynamicFormEnable: true
                                                        }));
                                                    }
                                                    setShowCreateForm(false);
                                                }}
                                                defaultInsertType="customer"
                                            />
                                        </div>
                                    </div>
                                </Modal>

                                {/* View-Only Form Preview */}
                                {formData.dynamicForm?.formId && selectedFormRes?.data && (
                                    <div className="mt-6 p-4">
                                        {/* <div className="flex items-center justify-between mb-4 px-2">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t("dynamicForm.preview.title") || "Form Preview"}
                      </h4>
                      <span className="text-xs text-gray-400">
                        {formData.dynamicForm.formName} (v{formData.dynamicForm.formVersion})
                      </span>
                    </div> */}
                                        <DynamicForm
                                            initialForm={selectedFormRes.data}
                                            edit={false}
                                            editFormData={false}
                                            enableFormTitle={false}
                                            enableSelfBg={false}
                                            enableShowVersion={false}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </SectionCard>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              text-white font-medium text-sm shadow-md
              transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {isUpdating ? t("customerConfigure.saving") : t("customerConfigure.saveConfig")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerFormConfig;
