import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import Button from "@/core/components/ui/button/Button";
import { IndividualFormFieldWithChildren, IndividualFormField, FormField, FormFieldWithChildren, FormManager, formMetaData } from "@/cms/components/interface/FormField";
import { useCreateFormMutation, useGetFormByFormIdMutation, useUpdateFormMutation } from "@/cms/store/api/formApi";
import { formConfigurations, versionListToText } from "./constant.tsx";
import 'react-phone-number-input/style.css'
import { getCountries } from 'react-phone-number-input/input'
import { validateDynamicFormInput } from "./validateDynamicForm.tsx";
import { ToastContainer } from "@/core/components/crud/ToastContainer.tsx";
import { useToast } from "@/core/hooks/useToast";
import { createDynamicFormField, getResponsiveColSpanClass, getResponsiveGridClass } from "./function.ts";
import { FormEdit } from "./dynamicFormEditMode.tsx";
import RenderFormField from "./renderFormField.tsx";
import { usePiiMasker } from "@/core/hooks/useMaskedValue";
import { ImportDynamicFormModal } from "./importDynamicFormModal.tsx";
import AddFormSelector from "./addFormSelector.tsx";
import { useTranslation } from "@/core/hooks/useTranslation.ts";
import { ArrowLeft, Download, Upload } from "lucide-react";
import ExportDynamicFormModal from "./exportDynamicForm.tsx";
import { SearchableSelect } from "@/cms/components/SearchInput/SearchSelectInput.tsx";
import { SpinnerIcon } from "@/core/icons/SpinnerIcon.tsx";
export type CountryCode = ReturnType<typeof getCountries>[number]




interface DynamicFormProps {
  initialForm?: FormManager | FormField;
  edit?: boolean;
  editFormData?: boolean;
  showDynamicForm?: React.Dispatch<React.SetStateAction<boolean>>;
  onFormSubmit?: (data: FormField) => void;
  enableFormTitle?: boolean;
  enableSelfBg?: boolean;
  saveDraftsLocalStoreName?: string;
  onFormChange?: (data: FormField) => void;
  returnValidValue?: (isValid: boolean) => void;
  showValidationErrors?: boolean;
  stickyFooter?: boolean;
  doFuncAterFormSave?: (data: FormField) => void;
  defaultInsertType?: string
  publishOnSubmit?: boolean,
  enableShowVersion?:boolean,
  /** Opt-in only - see `RenderFormField`. Case/SOP forms must stay unmasked. */
  maskPii?: boolean;
  /** Overrides the live `pii.view` check - see `RenderFormField` for why this exists. */
  canViewPii?: boolean;
}


const PageMeta: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  useEffect(() => {
    document.title = title;
  }, [title, description]);
  return null;
};




function DynamicForm({
  initialForm,
  edit = true,
  showDynamicForm,
  onFormSubmit,
  editFormData = true,
  enableFormTitle = true,
  enableSelfBg = false,
  saveDraftsLocalStoreName = "",
  onFormChange,
  returnValidValue,
  showValidationErrors = true,
  stickyFooter = false,
  doFuncAterFormSave,
  defaultInsertType = "case",
  publishOnSubmit = false,
  enableShowVersion =true,
  maskPii = false,
  canViewPii,
}: DynamicFormProps) {
  const [isPreview, setIsPreview] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const [updateFormData] = useUpdateFormMutation();
  const [createFormData] = useCreateFormMutation();
  const [isSaving, setIsSaving] = useState(false);
  const [hide, setHide] = useState<boolean>(false);
  const { t } = useTranslation();
  const [formMeta, setFormMeta] = useState<formMetaData | undefined>(undefined);
  // Called unconditionally (Rules of Hooks) even when `maskPii` is false - cheap, since
  // `useIsSystemAdmin` only reads `localStorage`, no network round trip. Only used as a
  // fallback: callers that already know create-vs-edit (e.g. `CustomerCreate`) pass
  // `canViewPii` explicitly so a brand-new record's PII fields aren't locked before anything
  // exists to protect - the same trap the static customer form hit.
  const { canViewPii: livePiiAccess } = usePiiMasker();
  const effectiveCanViewPii = canViewPii ?? livePiiAccess;

  useEffect(() => {
    if (initialForm && "versions" in initialForm) {
      setFormMeta({
        currentVersions: initialForm.versions,
        publish: initialForm.publish,
        versionsInfoList: initialForm?.versionsInfoList || [],
        selectVersion: initialForm?.versions
      });
    } else {
      setFormMeta(undefined);
    }
  }, [initialForm]);

  const [getForm] = useGetFormByFormIdMutation()
  const [isLoadingForm, setIsLoadingForm] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<FormFieldWithChildren>(
    {
      formId: "",
      formName: "New Dynamic Form",
      formColSpan: 1,
      formFieldJson: [],
      formType: "case"
    }
  );

  const Saving = () => {

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100000">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <div className="text-center">
              <div className="text-lg text-gray-700 dark:text-gray-200 font-semibold">{t("common.saving")}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (initialForm) {
      setCurrentForm({
        ...initialForm,
        formFieldJson: initialForm.formFieldJson?.map(field => {
          let updatedField: IndividualFormFieldWithChildren = { ...field as IndividualFormFieldWithChildren };

          if (updatedField.type === "InputGroup" && Array.isArray(updatedField.value)) {
            updatedField.value = updatedField.value as IndividualFormFieldWithChildren[];
          } else if (updatedField.type === "dynamicField") {
            updatedField.value = typeof updatedField.value === 'string' ? updatedField.value : "";
            updatedField.options = updatedField.options?.map(option => ({
              ...option,
              form: Array.isArray(option.form) ? option.form as IndividualFormFieldWithChildren[] : []
            }));
          }

          if (updatedField.type === "InputGroup" && updatedField.GroupColSpan === undefined) {
            updatedField.GroupColSpan = 1;
          }
          if (updatedField.type === "dynamicField" && updatedField.DynamicFieldColSpan === undefined) {
            updatedField.DynamicFieldColSpan = 1;
          }

          return updatedField;
        }) ?? []
      });
    } else {
      setCurrentForm({
        formId: "",
        formName: "New Dynamic Form", // This is default data
        formColSpan: 1,
        formFieldJson: [],
        formType: defaultInsertType
      });
    }
  }, [initialForm]);

  const [isImport, setImport] = useState(false);
  const [isExport, setExport] = useState(false);


  const getAllFieldIds = (fields: IndividualFormFieldWithChildren[]): string[] => {
    let ids: string[] = [];
    for (const field of fields) {
      ids.push(field.id);
      if (field.type === "InputGroup" && Array.isArray(field.value)) {
        ids = ids.concat(getAllFieldIds(field.value));
      }
      if (field.type === "dynamicField" && Array.isArray(field.options)) {
        for (const option of field.options) {
          if (Array.isArray(option.form)) {
            ids = ids.concat(getAllFieldIds(option.form));
          }
        }
      }
    }
    return ids;
  };


  const isSyncingWithInitialFormRef = useRef(false);

  useEffect(() => {
    if (onFormChange && currentForm) {
      if (isSyncingWithInitialFormRef.current) {
        isSyncingWithInitialFormRef.current = false;
      } else {
        onFormChange(currentForm);
      }
    }

    const isFormValid = validateDynamicFormInput(currentForm);

    if (returnValidValue) {
      returnValidValue(isFormValid);
    }
  }, [currentForm, onFormChange, returnValidValue]);


  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );













  const addField = useCallback((formType: string, parentId?: string) => {
    const newField = createDynamicFormField(
      formConfigurations.map((item) => {
        return { ...item, title: t(item.title) };
      }),
      formType,
      !!parentId
    );
    if (!newField) return;

    setCurrentForm(prevForm => {
      if (!parentId) {
        return {
          ...prevForm,
          formFieldJson: [...prevForm.formFieldJson, newField]
        };
      }

      const addRecursively = (fields: IndividualFormFieldWithChildren[]): IndividualFormFieldWithChildren[] => {
        return fields.map(field => {
          if (field.id === parentId && field.type === "InputGroup") {
            const newValue = Array.isArray(field.value) ? [...field.value, newField] : [newField];
            return { ...field, value: newValue };
          }
          if (field.type === "InputGroup" && Array.isArray(field.value)) {
            return { ...field, value: addRecursively(field.value) };
          }
          if (field.type === "dynamicField" && Array.isArray(field.options)) {
            const updatedOptions = field.options.map(option => ({
              ...option,
              form: Array.isArray(option.form) ? addRecursively(option.form) : []
            }));
            return { ...field, options: updatedOptions };
          }
          return field;
        });
      };

      return {
        ...prevForm,
        formFieldJson: addRecursively(prevForm.formFieldJson)
      };
    });
  }, []);



  const saveSchema = async () => {
    if (!currentForm.formName?.trim()) {
      addToast("error", t("dynamicForm.toasts.noFormName"));
      return;
    }

    const hasFields = currentForm.formFieldJson?.length > 0;
    if (!hasFields) {
      addToast("error", t("dynamicForm.toasts.noFields"));
      return;
    }

    let latestForm = currentForm;
    try {
      setIsSaving(true);

      const payload = {
        active: true,
        formColSpan: currentForm.formColSpan,
        formFieldJson: currentForm.formFieldJson,
        formName: currentForm.formName,
        formType: currentForm.formType,
        locks: false,
        publish: initialForm ? formMeta?.publish || false : publishOnSubmit,
      };

      //Checking for update or create
      const response: any = currentForm.formId != ""
        ? await updateFormData({ formId: currentForm.formId, ...payload }).unwrap()
        : await createFormData(payload).unwrap();

      // Handle missing formId that gen form backend (for create)
      if (currentForm.formId == "" && !response?.data) {
        addToast("error", response?.desc || t("dynamicForm.toasts.unexpectedResponse"));
        return;
      }

      // If form is newly created, store formId and metadata
      if (currentForm.formId == "" && response?.data) {
        latestForm = { ...currentForm, formId: response?.data?.formId, version: response?.data?.version };
        setCurrentForm(latestForm);
        setFormMeta((prev) =>
          ({ ...prev, currentVersions: response?.data?.version, publish: false, selectVersion: response?.data?.version, versionsInfoList: [...(prev?.versionsInfoList ?? []), response?.data?.version].sort((a, b) => a - b) }));
      } else if (response?.data?.version) {
        latestForm = { ...currentForm, version: response?.data?.version };
      }

      if (response.msg.toLowerCase() === "success") {
        addToast("success", t("common.success"));
        return {
          version: response?.data?.version,
          formId: response?.data?.formId || currentForm.formId
        };
      } else {
        addToast("error", response?.desc || t("dynamicForm.toasts.somethingWentWrong"));
      }
    } catch (error: any) {
      addToast("error", error?.data?.desc || t("dynamicForm.toasts.unexpectedError"));
    } finally {
      doFuncAterFormSave && doFuncAterFormSave(latestForm);
      setIsSaving(false);
    }
  };


  const transformFieldForSubmission = useCallback((field: IndividualFormFieldWithChildren): IndividualFormField => {
    const { isChild, ...rest } = field;

    if (rest.type === "InputGroup" && Array.isArray(rest.value)) {
      return {
        ...rest,
        value: rest.value.map(transformFieldForSubmission),
      } as IndividualFormField;
    }

    if (rest.type === "dynamicField" && Array.isArray(rest.options)) {
      return {
        ...rest,
        options: rest.options.map(option => ({
          ...option,
          form: Array.isArray(option.form) ? option.form.map(transformFieldForSubmission) : []
        }))
      };
    }

    return rest;
  }, []);


  const handleSend = useCallback(() => {

    const isFormValid = validateDynamicFormInput(currentForm);

    if (isFormValid) {
      if (onFormSubmit) {
        const submitData: FormField = {
          ...currentForm,
          formFieldJson: currentForm.formFieldJson.map(transformFieldForSubmission),
        };
        console.log("Sending Valid Form Data:", submitData);
        onFormSubmit(submitData);
      }
    } else {
      addToast("error", t("dynamicForm.toasts.correctErrors"));
    }
  }, [currentForm, onFormSubmit, transformFieldForSubmission, t, addToast]);






  const getDrafts = () => {
    if (saveDraftsLocalStoreName !== "") {
      try {
        const savedDraft = localStorage.getItem(saveDraftsLocalStoreName);
        if (savedDraft) {
          const parsedDraft: FormFieldWithChildren = JSON.parse(savedDraft);
          setCurrentForm(parsedDraft);
          console.log(t("dynamicForm.toasts.draftLoaded"), parsedDraft.formName);
        } else {
          console.log(t("dynamicForm.toasts.noDraftFound"));
        }
      } catch (error) {
        console.error(t("dynamicForm.toasts.parseDraftError"), error);
        localStorage.removeItem(saveDraftsLocalStoreName);
      }
    }
  };
  useEffect(() => {
    getDrafts();
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveDrafts = () => {
    const handleSaveDrafts = () => {
      localStorage.setItem(saveDraftsLocalStoreName, JSON.stringify(currentForm))
    }
    return (<div >
      <Button variant="success" onClick={handleSaveDrafts}>{t("dynamicForm.saveDrafts")}</Button>
    </div>
    )
  }



  type PathSegment = UniqueIdentifier | { id: UniqueIdentifier; optionValue: string };

  const getParentAndCurrentArray = useCallback((
    fields: IndividualFormFieldWithChildren[],
    id: UniqueIdentifier,
    parentPath: PathSegment[] = []
  ): { arr: IndividualFormFieldWithChildren[]; index: number; path: PathSegment[] } | null => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (field.id === id) {
        return { arr: fields, index: i, path: parentPath };
      }
      if (field.type === "InputGroup" && Array.isArray(field.value)) {
        const found = getParentAndCurrentArray(field.value, id, [...parentPath, field.id]);
        if (found) return found;
      }
      if (field.type === "dynamicField" && Array.isArray(field.options)) {
        for (const option of field.options) {
          if (Array.isArray(option.form)) {
            const found = getParentAndCurrentArray(option.form, id, [...parentPath, { id: field.id, optionValue: option.value }]);
            if (found) return found;
          }
        }
      }
    }
    return null;
  }, []);


  const updateNestedFormFields = useCallback((
    fields: IndividualFormFieldWithChildren[],
    path: PathSegment[],
    updatedArray: IndividualFormFieldWithChildren[]
  ): IndividualFormFieldWithChildren[] => {
    if (path.length === 0) {
      return updatedArray;
    }

    const currentPathSegment = path[0];
    const currentId = (typeof currentPathSegment === 'object' && currentPathSegment !== null)
      ? currentPathSegment.id
      : currentPathSegment;

    return fields.map(field => {
      if (field.id !== currentId) {
        return field;
      }

      if (field.type === "InputGroup" && (typeof currentPathSegment === 'string' || typeof currentPathSegment === 'number')) {
        return { ...field, value: updateNestedFormFields(Array.isArray(field.value) ? field.value : [], path.slice(1), updatedArray) };
      }

      if (field.type === "dynamicField" && typeof currentPathSegment === 'object' && currentPathSegment !== null) {
        const optionValueToUpdate = currentPathSegment.optionValue;
        const updatedOptions = field.options?.map(option => {
          if (option.value === optionValueToUpdate) {
            return { ...option, form: updateNestedFormFields(Array.isArray(option.form) ? option.form : [], path.slice(1), updatedArray) };
          }
          return option;
        });
        return { ...field, options: updatedOptions };
      }
      return field;
    });
  }, []);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setCurrentForm(prevForm => {
      const newFormFieldJson = JSON.parse(JSON.stringify(prevForm.formFieldJson));

      const activeInfo = getParentAndCurrentArray(newFormFieldJson, active.id);
      const overInfo = getParentAndCurrentArray(newFormFieldJson, over.id);

      if (!activeInfo || !overInfo) {
        return prevForm;
      }

      const pathToString = (p: PathSegment[]) => p.map(i => (typeof i === 'object' ? `${i.id}_${i.optionValue}` : i)).join('>');

      if (pathToString(activeInfo.path) !== pathToString(overInfo.path)) {
        console.warn("Moving items between different groups is not allowed."); // Developer-facing, no i18n needed
        return prevForm;
      }

      const { arr: activeArr, index: activeIndex } = activeInfo;
      const { index: overIndex } = overInfo;
      const reorderedArr = arrayMove(activeArr, activeIndex, overIndex);

      const finalFormJson = updateNestedFormFields(newFormFieldJson, activeInfo.path, reorderedArr);

      return { ...prevForm, formFieldJson: finalFormJson };
    });
  }, [getParentAndCurrentArray, updateNestedFormFields]);

  const handleChangeVersion = async (versions: string) => {
    setIsLoadingForm(true)
    setCurrentForm((prev) => ({
      ...(prev),
      formFieldJson: [],
    }));
    const result = await getForm({ formId: currentForm.formId, version: versions }).unwrap()
    setCurrentForm(result?.data as FormFieldWithChildren)
    setIsLoadingForm(false)
    setFormMeta((prev) => (prev ? {
      ...(prev),
      selectVersion: versions,
    }
      : undefined));
  }


  const FormPreview = useCallback(() => {
    return (
      <div>
        <div className=" flex justify-between">
          {enableFormTitle && <div className="px-3 text-xl dark:text-white">{currentForm.formName}</div>}
          {enableShowVersion && formMeta?.versionsInfoList && formMeta?.versionsInfoList.length != 0 && edit == false &&
            <SearchableSelect
              className='w-fit items-end justify-end rounded-full text-xs font-medium'
              value={formMeta?.selectVersion}
              prefixedStringValue="v "
              subfixedStringValue=" "
              isDynamic={true}
              options={versionListToText(
                formMeta.versionsInfoList?.filter(item => item.version === formMeta.currentVersions || item.publish === true) || [],
                formMeta.currentVersions
              ) || []}
              onChange={handleChangeVersion}
              disabledRemoveButton={true}
            />

          }
        </div>
        {isLoadingForm ? <div className="flex justify-center text-gray-500 items-center">
          <SpinnerIcon className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin mr-2" /> {t("common.loading")}
        </div> : currentForm.formFieldJson.length === 0 ? (<p className="text-center text-gray-500 italic mb-4">{t("dynamicForm.preview.noFields")}</p>
        ) : (
          <div className={`grid grid-cols-1 ${getResponsiveGridClass(currentForm.formColSpan)} gap-4`}>
            {currentForm.formFieldJson.map((field) => (<div key={field.id} className={`mb-2 px-4 relative ${getResponsiveColSpanClass(field.colSpan)}`}><RenderFormField setCurrentForm={setCurrentForm} field={field} showValidationErrors={showValidationErrors} editFormData={editFormData} maskPii={maskPii} canViewPii={effectiveCanViewPii} /></div>))}
          </div>
        )}
      </div>
    );
  }, [currentForm, enableFormTitle, formMeta, edit, t, isLoadingForm, showValidationErrors, editFormData, maskPii, effectiveCanViewPii]); // Added dependencies

  return edit ? (
    <div
      className={
        !isPreview
          ? `grid ${hide ? "" : "grid-cols-[2fr_8fr]"
          } md:block`
          : ""
      }
    >
      <PageMeta title={t("dynamicForm.pageTitle")} description="" />
      {/* <PageBreadcrumb pageTitle="Form Builder"  /> */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {isSaving && <Saving />}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>

        <AddFormSelector
          isOpen={!isPreview}
          addField={addField}
          hide={hide}
          setHide={setHide}
        />

        <div className="fixed-1 grid grid-cols-1 gap-6">
          <div hidden={isPreview}>
            <FormEdit
              currentForm={currentForm}
              addField={addField}
              editFormData={editFormData}
              setCurrentForm={setCurrentForm}
              showValidationErrors={showValidationErrors}
              formMetaData={formMeta}
            />
            <ImportDynamicFormModal isImport={isImport} setImport={setImport} setCurrentForm={setCurrentForm} />
            <ExportDynamicFormModal isOpen={isExport} onClose={() => { setExport(false) }} currentForm={{
              formColSpan: currentForm.formColSpan,
              formFieldJson: currentForm.formFieldJson,
              formId: currentForm.formId,
              formName: currentForm.formName
            }} />
            <div className={`${stickyFooter ? "sticky bottom-0  w-full" : "fixed bottom-0 shadow-md  m-4"}  z-50 right-0`}>
              <div className={`flex space-x-2 ${stickyFooter ? "justify-end" : ""}`}>
                <Button variant="outline-no-transparent" onClick={() => setImport(true)} disabled={!editFormData}><Upload className="w-4 h-4 mr-2" />{t("common.import")}</Button>
                <Button variant="outline-no-transparent" onClick={() => setExport(true)} disabled={!editFormData}><Download className="w-4 h-4 mr-2" />{t("common.export")}</Button>
                <Button onClick={() => setIsPreview(true)} disabled={!editFormData}>{t("common.preview")}</Button>
              </div>
            </div>
          </div>
          {enableSelfBg && isPreview && <div><Button variant="ghost" size="sm" onClick={() => setIsPreview(false)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("case.back")}
          </Button></div>}
          <div hidden={!isPreview} className={enableSelfBg ? " h-fit relative rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12" : undefined}>
            {FormPreview()}
            <div className={`${stickyFooter ? "sticky bottom-0  p-4 -mx-4 w-full" : "fixed bottom-0 w-ful shadow-md z-50 m-4"}  z-50 right-0`}>
              <div className="flex space-x-2">
                <Button variant="outline-no-transparent" onClick={() => setIsPreview(false)} disabled={!editFormData}>
                  {t("common.edit")}
                </Button>
                <Button onClick={saveSchema} disabled={!editFormData}>
                  {initialForm ? t("dynamicForm.saveChange") : t("dynamicForm.saveForm")}
                </Button>
                <div className="flex gap-2">

                  {/* <Button onClick={handleSend} className="bg-green-500 hover:bg-green-600">{t("common.submit")}</Button> */}
                </div>
              </div>
            </div>

          </div>


        </div>
      </DndContext>
    </div>
  ) : (


    <div className={enableSelfBg ? " rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/3 xl:px-10 xl:py-12" : undefined}>
      {FormPreview()}
      <div className="flex justify-between w-full mt-4">
        {showDynamicForm && <Button className="m-4" onClick={() => showDynamicForm(false)}>{t("common.close")}</Button>}
        {saveDraftsLocalStoreName != "" ? saveDrafts() : null}
        {onFormSubmit && currentForm.formFieldJson.length > 0 && <Button className="m-4" onClick={handleSend}>{t("common.submit")}</Button>}
      </div>
    </div>
  );
}

export default React.memo(DynamicForm)