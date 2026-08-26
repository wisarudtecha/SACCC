import { REQUIRED_ELEMENT } from "@/cms/components/case/constants/caseConstants";
import { userType, LANGUAGE_PREFERENCE_OPTIONS, CONTRACT_PREFERENCE_OPTIONS } from "@/cms/components/customer/constant";
import { getTodayDate } from "@/cms/components/date/DateToString";
import DynamicForm from "@/cms/components/form/dynamic-form/DynamicForm";
import { validateDynamicFormInput } from "@/cms/components/form/dynamic-form/validateDynamicForm";
import Checkbox from "@/core/components/form/input/Checkbox";
import DatePickerLocal from "@/core/components/form/input/DatepicketLocal";
import Input from "@/core/components/form/input/InputField";
import { usePiiMasker } from "@/core/hooks/useMaskedValue";
import { MaskedField } from "@/core/components/security/MaskedField";
import { omitUnviewableCustomerPii } from "@/core/security/piiFields";
import TextAreaWithCounter from "@/core/components/form/input/TextAreaWithCounter";
import Select from "@/core/components/form/Select";
import { FormField, IndividualFormField } from "@/cms/components/interface/FormField";
import { SearchableSelectApi } from "@/cms/components/SearchInput/SearchSelectInput";
import { useLazyGetWelcomeAreaQuery, useLazyGetWelcomeSubDistrictsQuery, useGetWelcomeProvinceQuery, useGetWelcomeDistrictsQuery, useGetWelcomeSubDistrictsQuery } from "@/cms/store/api/area";
import { Customer, CustomerProduct, useInsertCustommersMutationMutation, useUpdateCustommersMutationMutation, useGetCustomerQuery, useGetCustomerFormConfigQuery, useLazyGetCustommerByPhoneNoQuery } from "@/cms/store/api/custommerApi";
import { usePatchUpdateCaseCustomerMutation } from "@/cms/store/api/caseApi";
import { useGetFormByFormIdQueryQuery } from "@/cms/store/api/formApi";
import { AreaResponse, Province, District, Subdistrict } from "@/cms/types/area";
import { AddCustomer } from "@/cms/types/customer";
import Loading from "@/core/components/common/Loading";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePostUploadFileMutationMutation } from "@/core/store/api/file";
import { ChevronUp, UserCircleIcon, CameraIcon } from "lucide-react";
import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCustomerSocials } from "@/cms/hooks/useCustomerSocials";
import { useCustomerPrimaryContact } from "@/cms/hooks/useCustomerPrimaryContact";
import { useUpdateCustomerContactDefaultMutation } from "@/cms/store/api/customerContactDefault";
import { identityKey, isTypeInFamily, preferredChannelFamily } from "@/cms/utils/customerSocial.policy";
import { readEnvelopeStatus } from "@/core/utils/apiResponseStatus";
import { SocialAccountDraftList } from "@/cms/components/customer/social/SocialAccountDraftList";
import { SocialAccountManager } from "@/cms/components/customer/social/SocialAccountManager";
import type { DraftCustomerSocial } from "@/cms/types/customerSocial";
import { isValidPhoneNumber } from "react-phone-number-input";
import { CaseDetails } from "@/cms/types/case";


const DEFAULT_ADDRESS = {
    no: "",
    lat: "",
    lon: "",
    road: "",
    room: "",
    floor: "",
    street: "",
    country: "",
    building: "",
    district: "",
    province: "",
    postalCode: "",
    subDistrict: "",
};

const DEFAULT_CUSTOMER_DATA: AddCustomer = {
    active: true,
    currentAddress: { ...DEFAULT_ADDRESS },
    address: { ...DEFAULT_ADDRESS },
    blood: "",
    citizenId: "",
    displayName: "",
    dob: "",
    email: "",
    firstName: "",
    gender: "",
    lastName: "",
    landline: "",
    middleName: "",
    mobileNo: "",
    photo: "",
    title: "",
    userType: null,
};

const formatCitizenId = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const match = digits.match(/^(\d{0,1})(\d{0,4})(\d{0,5})(\d{0,2})(\d{0,1})$/);
    if (!match) return digits;
    const parts = [match[1], match[2], match[3], match[4], match[5]];
    return parts.filter(Boolean).join("-");
};



// interface Step {
//     id: string;
//     label: string;
// }

// interface FormProgressBarProps {
//     steps: Step[];
//     currentStepId: string;
//     onStepClick?: (stepId: any) => void;
// }

// const FormProgressBar: React.FC<FormProgressBarProps> = ({ steps, currentStepId, onStepClick }) => {
//     const currentIndex = steps.findIndex(s => s.id === currentStepId);

//     return (
//         <div className="w-full py-6">
//             <div className="flex items-center justify-center max-w-2xl mx-auto relative">
//                 <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -z-0">
//                     <div
//                         className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
//                         style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
//                     />
//                 </div>

//                 {steps.map((step, index) => {
//                     const isCompleted = index < currentIndex;
//                     const isActive = index === currentIndex;

//                     return (
//                         <div key={step.id} className="flex-1 flex flex-col items-center relative z-10">
//                             <button
//                                 type="button"
//                                 onClick={() => onStepClick?.(step.id)}
//                                 disabled={!isCompleted && !isActive}
//                                 className={`
//                                     w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
//                                     ${isCompleted || isActive
//                                         ? 'bg-blue-600 border-blue-600 text-white shadow-md'
//                                         : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-400'}
//                                     ${isCompleted ? 'cursor-pointer hover:bg-blue-700' : ''}
//                                 `}
//                             >
//                                 {isCompleted ? (
//                                     <Check size={20} strokeWidth={3} />
//                                 ) : (
//                                     <span className="text-sm font-bold">{index + 1}</span>
//                                 )}
//                             </button>

//                             <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300
//                                 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}
//                             `}>
//                                 {step.label}
//                             </span>
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };



interface CustomerCreateProps {
    customer?: CustomerProduct;
    onSuccess?: () => void;
    customerNumber?: string;
    minimal?: boolean;
    setOpenAddCustomerModal?: React.Dispatch<React.SetStateAction<boolean>>;
    setCaseState?: React.Dispatch<React.SetStateAction<CaseDetails | undefined>>;
    caseWorkOrderNumber?: string;
    isCreate?: boolean;
}

const CustomerCreate: React.FC<CustomerCreateProps> = ({ customer, onSuccess, customerNumber, minimal = false, setOpenAddCustomerModal, setCaseState, caseWorkOrderNumber, isCreate }) => {
    const { t, language } = useTranslation();
    /**
     * PII fields the agent may not see render as **plain text**, not as an input.
     *
     * A disabled input still advertises a field they cannot have, and — the part that actually
     * matters — it does nothing about the value sitting in `formData`. The record now arrives
     * from the server already redacted, and `handleSubmit` builds its PATCH body from
     * `formData` rather than from the DOM, so hiding the input would send `••••1234` straight
     * back over the real number. `omitUnviewableCustomerPii` is what prevents that; the text
     * render is what stops the agent expecting to be able to edit it.
     *
     * This holds whether or not the frontend is masking (`PII_MASKING_ENABLED`): it is a
     * permission question, not a display one.
     *
     * Applies to **edit only**. On create there is no stored value to withhold — the agent is
     * the source of it — so withholding there would disclose nothing and simply make the form
     * unusable, since `email` and `mobileNo` are required to save.
     */
    const { canViewField, canViewDynamicField } = usePiiMasker();
    const isExistingCustomer = Boolean(customer?.id);
    const canEditPii = (path: string): boolean => !isExistingCustomer || canViewField(path);
    const canEditDynamicPii = (field: IndividualFormField): boolean =>
        !isExistingCustomer || canViewDynamicField(field);
    /** Mirrors `Input`'s own height and text metrics so swapping one for the other doesn't shift the grid. */
    const PII_TEXT_CLASSES = "h-11 flex items-center px-4 py-2.5 text-sm text-gray-800 dark:text-white/90";
    const [addCustomer, { isLoading: isAddingCustomer }] = useInsertCustommersMutationMutation();
    const [updateCustomer, { isLoading: isUpdatingCustomer }] = useUpdateCustommersMutationMutation();
    const [getCustomerByPhone] = useLazyGetCustommerByPhoneNoQuery();
    const [updateCaseCustomer] = usePatchUpdateCaseCustomerMutation();

    const { data: fullCustomerRes, isFetching: isFetchingDetails } = useGetCustomerQuery(customer?.id || "", {
        skip: !customer?.id
    });

    const { data: formConfigRes } = useGetCustomerFormConfigQuery();
    const formConfig = useMemo(() => {
        return {
            ...formConfigRes?.data,
            dynamicFormEnable: formConfigRes?.data?.dynamicForm ? true : false
        };
    }, [formConfigRes?.data]);

    const [triggerGetArea] = useLazyGetWelcomeAreaQuery();
    const [triggerGetSubDistricts] = useLazyGetWelcomeSubDistrictsQuery();
    const editData = fullCustomerRes?.data;

    const [addressIds, setAddressIds] = useState<{
        address: { provinceId: string; districtId: string; subDistrictId: string };
        currentAddress: { provinceId: string; districtId: string; subDistrictId: string };
    }>({
        address: { provinceId: "", districtId: "", subDistrictId: "" },
        currentAddress: { provinceId: "", districtId: "", subDistrictId: "" },
    });
    const [fileUploader, { isLoading: isUploading }] = usePostUploadFileMutationMutation();
    const { addToast } = useToastContext()
    const [formData, setFormData] = useState<AddCustomer>(DEFAULT_CUSTOMER_DATA);

    const { data: selectedFormRes, isFetching: isFetchingForm, error: formError } = useGetFormByFormIdQueryQuery(
        {
            formId: formConfig?.dynamicForm?.formId || "",
            version: formConfig?.dynamicForm?.versions || "",
        },
        { skip: !formConfig?.dynamicForm?.formId }
    );



    const [sectionsOpen, setSectionsOpen] = useState({
        profile: true,
        personal: true,
        address: true,
        specificForm: true,
        preferences: true,
        social: true
    });

    /**
     * Social identities entered while creating a customer who doesn't exist yet.
     *
     * `CustomerSocialInput` requires a `custId`, so these can't be written with the rest of
     * the form — they're attached in `handleSubmit` once the new customer has an id. When
     * editing an existing customer the manager writes directly and this stays empty.
     */
    const [socialDrafts, setSocialDrafts] = useState<DraftCustomerSocial[]>([]);
    const { socials, lookupIdentity, addSocial } = useCustomerSocials({ customerId: customer?.id });

    /**
     * Which draft channel is the customer's primary way of being contacted, held as an
     * `identityKey` rather than an index so removing a draft can't promote its neighbour.
     *
     * Same deferral as the drafts themselves: `UpdateCustomerContactDefault` needs a `custId`,
     * so this is written in `handleSubmit` once the customer exists. Leaving it unset is a
     * valid outcome — the badge then falls back to `contractPreference`, exactly as it did
     * before primaries were storable.
     */
    const [primaryDraftKey, setPrimaryDraftKey] = useState<string>("");
    const [setPrimaryContact] = useUpdateCustomerContactDefaultMutation();

    /**
     * Editing: the stored primary entry has to follow the preference dropdown. Changing the
     * channel to LINE leaves a record pointing at a phone number contradicted — the badge
     * already ignores it, and this is what stops the BFF record itself staying wrong.
     */
    const { reconcileToPreference } = useCustomerPrimaryContact({
        customer: editData,
        socials,
        enabled: Boolean(customer?.id),
    });

    const handleSetPrimaryDraft = useCallback((draft: DraftCustomerSocial | undefined) => {
        setPrimaryDraftKey(draft ? identityKey(draft.socialType, draft.socialId) : "");
    }, []);

    const toggleSection = useCallback((section: keyof typeof sectionsOpen) => {
        setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);

    useEffect(() => {
        if (editData) {
            setFormData({
                active: editData.active,
                blood: editData.blood,
                citizenId: editData.citizenId,
                displayName: editData.displayName,
                dob: editData.dob,
                email: editData.email,
                firstName: editData.firstName,
                gender: editData.gender,
                lastName: editData.lastName,
                middleName: editData.middleName,
                mobileNo: editData.mobileNo,
                landline: editData.landline,
                photo: editData.photo,
                title: editData.title,
                userType: editData.userType ? editData.userType : null,
                address: { ...DEFAULT_ADDRESS, ...editData.address },
                languagePreference: editData.languagePreference,
                note: editData.note,
                contractPreference: editData.contractPreference,
                currentAddress: editData.currentAddress ? { ...DEFAULT_ADDRESS, ...editData.currentAddress } : { ...DEFAULT_ADDRESS, ...editData.address },
                dynamicForm: editData.dynamicForm
            });
            setImagePreview(editData.photo || null);
            setCurrentAddressIsAddress(!editData.currentAddress || JSON.stringify(editData.currentAddress) === JSON.stringify(editData.address));
        }
    }, [editData, formConfig]);

    const [currentAddressIsAddress, setCurrentAddressIsAddress] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "citizenId") {
            const rawValue = value.replace(/\D/g, "").slice(0, 13);
            setFormData(prev => ({ ...prev, [name]: rawValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }, []);

    const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [name]: value }
        }));
    }, []);


    const handleCurrentAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            currentAddress: { ...prev.currentAddress, [name]: value }
        }));
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
            };
            reader.readAsDataURL(file);
        }
        else {
            setImagePreview(null);
        }
    }, []);

    const handleDateChange = useCallback((date: Date | null) => {
        setFormData((prev) => ({
            ...prev,
            dob: date?.toISOString() || ""
        }));
    }, []);

    const handleSelectChange = useCallback((name: string, val: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleInputChange({ target: { name, value: val } } as any);

        if (name !== "contractPreference") {
            return;
        }

        // The preference decides the channel, so a draft marked primary on a channel it no
        // longer names has to give the mark up — otherwise the create flow would write a
        // primary the very next read overrules.
        setPrimaryDraftKey(previous => {
            if (!previous) {
                return previous;
            }
            const marked = socialDrafts.find(
                draft => identityKey(draft.socialType, draft.socialId) === previous
            );
            return marked && isTypeInFamily(marked.socialType, preferredChannelFamily(val))
                ? previous
                : "";
        });
    }, [handleInputChange, socialDrafts]);

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleCheckRequirePersonalData = () => {
        let isTrue = true;

        // A field the agent can't see arrived redacted and renders as text, so holding it to
        // its own required/format rules would block them from saving edits to everything else.
        if (formData.dynamicForm && !validateDynamicFormInput(formData.dynamicForm, field => !canEditDynamicPii(field))) {
            addToast("error", t("input.notEnterSpecifyForm"));
            // return false;
            isTrue = false;
        }

        if (formConfig?.email && canEditPii("email")) {
            if (!formData.email?.trim()) {
                addToast("error", t("input.notEnterEmailError"));
                setFieldErrors(prev => ({ ...prev, email: t("input.notEnterEmailError") }));
                // return false;
                isTrue = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
                addToast("error", t("input.invalidEmailError"));
                setFieldErrors(prev => ({ ...prev, email: t("input.invalidEmailError") }));
                // return false;
                isTrue = false;
            }
        }

        if (formConfig?.mobileNo && canEditPii("mobileNo")) {
            if (!formData.mobileNo?.trim()) {
                addToast("error", t("input.notEnterMobileNumberError"));
                setFieldErrors(prev => ({ ...prev, mobileNo: t("input.notEnterMobileNumberError") }));
                // return false;
                isTrue = false;
            } else if (!isValidPhoneNumber(formData.mobileNo, "TH")) {
                addToast("error", t("input.invalidMobileNumberInput"));
                setFieldErrors(prev => ({ ...prev, mobileNo: t("input.invalidMobileNumberInput") }));
                // return false;
                isTrue = false;
            }
        }

        return isTrue;
    }

    const handleSubmit = useCallback(async () => {
        try {
            let photoUrl = formData.photo;
            if (!handleCheckRequirePersonalData())
                return
            if (selectedFile) {
                const uploadResponse = await fileUploader({
                    file: selectedFile,
                    path: "customer"
                }).unwrap();

                photoUrl = uploadResponse.data?.attUrl || "";
            }

            // A Text Chat draft can carry an optional email, and there is no email column on
            // the social record to put it in. Fill the customer's own address with it when
            // they have none - never overwrite one they already have, since a chat session's
            // email is weaker evidence than whatever is already on the profile.
            const draftEmail = socialDrafts.find(draft => draft.email?.trim())?.email?.trim();
            const resolvedEmail = formData.email || draftEmail || "";

            // The marked draft only says *which entry*; the channel is whatever the preference
            // dropdown holds. A mark on another channel is ignored rather than allowed to
            // override the preference — the dropdown's `onChange` normally clears it, but a
            // draft edited after marking can still land here.
            const markedDraft = socialDrafts.find(
                draft => identityKey(draft.socialType, draft.socialId) === primaryDraftKey
            );
            const primaryDraft = markedDraft
                && isTypeInFamily(markedDraft.socialType, preferredChannelFamily(formData.contractPreference))
                ? markedDraft
                : undefined;

            const finalPayload: AddCustomer = {
                ...formData,
                email: resolvedEmail,
                dob: formData.dob || null,
                userType: formData.userType || null,
                gender: formData.gender || null,
                photo: photoUrl,
                dynamicForm: formData.dynamicForm,
                // `displayName` is not itself PII, so it is never stripped — which makes the
                // email fallback a way for a redacted address to reach the record through the
                // back door. Keep the stored name when the agent cannot see the email.
                displayName: formData.firstName && formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`.trim()
                    : canEditPii("email")
                        ? `${resolvedEmail}`
                        : formData.displayName || ""
            };

            if (customer?.id) {
                // Every PII field this agent cannot see is dropped from the body rather than
                // sent back as the redacted string the server handed us. The endpoint is a
                // PATCH and ignores absent keys, so the stored values are left alone.
                //
                // Only on update: a create has no stored record to overwrite, and its PII came
                // from the agent in the first place.
                const updatePayload = omitUnviewableCustomerPii(finalPayload, canViewField);
                const updateResult = await updateCustomer({ id: customer.id, data: updatePayload }).unwrap();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (Number((updateResult as any)?.status) < 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const errMsg = [(updateResult as any)?.msg, (updateResult as any)?.desc].filter(Boolean).join(" - ");
                    addToast("error", errMsg || t("common.error"));
                    return;
                }
                addToast("success", t("common.success"));

                // The preference may have moved to a channel the stored primary entry doesn't
                // belong to. No-op when it still agrees, so an unchanged dropdown costs
                // nothing; failures are swallowed because the badge resolves correctly either
                // way — this only keeps the BFF record honest for anything reading it directly.
                await reconcileToPreference(finalPayload.contractPreference);

                setOpenAddCustomerModal?.(false);

                setCaseState?.((prev: CaseDetails | undefined) => {
                    if (!prev) {
                        return prev;
                    }

                    const updatedCustomerState = { ...finalPayload, id: customer.id } as Partial<Customer>;
                    // Same rule as link/add: the case's phone field is case-owned, editing
                    // the customer profile must not overwrite it.
                    if (isCreate || prev?.customerData?.mobileNo) {
                        delete updatedCustomerState.mobileNo;
                    }

                    return {
                        ...prev,
                        customerData: {
                            ...prev?.customerData,
                            ...(updatedCustomerState as unknown as Customer),
                            name: updatedCustomerState?.displayName || finalPayload.displayName || ""
                        }
                    };
                });
            } else {
                const addResult = await addCustomer(finalPayload).unwrap();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (Number((addResult as any)?.status) < 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    addToast("error", (addResult as any)?.desc || (addResult as any)?.msg || t("common.error"));
                    return;
                }
                addToast("success", t("common.success"));

                setOpenAddCustomerModal?.(false);

                // The insert endpoint's response carries no customer data (typed ApiResponse<null>),
                // so the real id has to be resolved with a follow-up lookup by the phone number just submitted.
                let createdCustomer: Customer | undefined;

                // ...except the endpoint may in fact echo the created record. Prefer that when it
                // does: the phone lookup below cannot help a customer created from a social
                // channel alone, which is exactly the LINE/Facebook case this form now supports.
                // Structural probe on purpose: the endpoint is typed `ApiResponse<null>`, so
                // this reads a payload the type says cannot be there. If it is, it is the only
                // way a social-only customer ever learns its own id.
                const echoed = (addResult as unknown as { data?: Customer } | undefined)?.data;
                if (echoed && typeof echoed === "object" && !Array.isArray(echoed) && echoed.id) {
                    createdCustomer = echoed;
                }

                if (!createdCustomer && finalPayload.mobileNo) {
                    try {
                        const lookupRes = await getCustomerByPhone({ id: finalPayload.mobileNo }).unwrap();
                        createdCustomer = lookupRes?.data;
                    } catch (error) {
                        console.warn("Failed to fetch newly created customer by phone:", error);
                    }
                }

                // Attach the collected social identities now that a customer id exists.
                if (socialDrafts.length > 0) {
                    if (createdCustomer?.id) {
                        const outcomes = await Promise.all(
                            socialDrafts.map(draft => addSocial(draft, createdCustomer!.id))
                        );
                        const failed = outcomes.filter(outcome => !outcome.ok).length;
                        if (failed > 0) {
                            // The customer itself saved, so this is a partial success, not a
                            // failure - say which part didn't land rather than rolling back.
                            addToast("warning", t("customer.social.partial_attach", { count: failed }));
                        }
                    } else {
                        // No id to attach to. The customer exists and must not be lost; the
                        // channels have to be added from their profile instead.
                        addToast("warning", t("customer.social.attach_needs_profile"));
                    }
                }

                // The primary points at a channel, so it is only meaningful once that channel
                // has actually been attached — hence after the block above, not with the rest
                // of the customer body. `referId` is the draft's own `socialId`, which is why
                // this needs no lookup of the row that was just created.
                if (primaryDraft && createdCustomer?.id) {
                    try {
                        const primaryResult = await setPrimaryContact({
                            customerId: createdCustomer.id,
                            type: primaryDraft.socialType,
                            referId: primaryDraft.socialId.trim(),
                        }).unwrap();

                        if (readEnvelopeStatus(primaryResult?.status) === "failure") {
                            addToast("warning", t("customer.social.primary_not_saved"));
                        }
                    }
                    catch {
                        // The customer and its channels saved; a missing primary is a partial
                        // success the agent can fix from the profile, not a reason to alarm.
                        addToast("warning", t("customer.social.primary_not_saved"));
                    }
                }

                // Persist the link to the case immediately (same as "Link existing customer") so
                // it isn't lost if the user navigates away without toggling edit mode / saving.
                if (caseWorkOrderNumber && createdCustomer?.id) {
                    try {
                        await updateCaseCustomer({ id: caseWorkOrderNumber, customerId: Number(createdCustomer.id) }).unwrap();
                    } catch (error) {
                        console.error("Failed to link newly created customer to case:", error);
                        addToast("error", t("common.error"));
                    }
                }

                setCaseState?.((prev: CaseDetails | undefined) => {
                    if (!prev) {
                        return prev;
                    }

                    const createdCustomerState = { ...(createdCustomer ?? finalPayload) } as Partial<Customer>;
                    // In the create-case flow the phone number field is user-owned - adding a
                    // customer must never overwrite it, whether it's currently blank or already
                    // filled in. Outside create, only preserve it when the agent already typed one.
                    if (isCreate || prev?.customerData?.mobileNo) {
                        delete createdCustomerState.mobileNo;
                    }

                    return {
                        ...prev,
                        customerData: {
                            ...prev?.customerData,
                            ...(createdCustomerState as unknown as Customer),
                            name: createdCustomerState?.displayName || finalPayload.displayName || ""
                        }
                    };
                });
            }

            onSuccess?.();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Submit Error:', error);
            addToast("error", t("common.error"));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData, selectedFile, fileUploader, addCustomer, updateCustomer, getCustomerByPhone, updateCaseCustomer, caseWorkOrderNumber, addToast, t, customer, onSuccess, isCreate, socialDrafts, addSocial, primaryDraftKey, setPrimaryContact, reconcileToPreference, canViewField, isExistingCustomer]);

    const titleOptions = useMemo(() => [
        { value: "Mr", label: "Mr." },
        { value: "Ms", label: "Ms." },
        { value: "Mrs", label: "Mrs." }
    ], []);

    const genderOptions = useMemo(() => [
        { value: "1", label: t("common.male") },
        { value: "2", label: t("common.female") },
        { value: "3", label: t("common.other") }
    ], [t]);

    const bloodOptions = useMemo(() => [
        { value: "A", label: "A" },
        { value: "B", label: "B" },
        { value: "AB", label: "AB" },
        { value: "O", label: "O" }
    ], []);

    const userTypeOptions = useMemo(() =>
        Object.entries(userType).map(([key, name]) => ({
            value: key,
            label: name
        })),
        []);

    const selectedDob = useMemo(
        () => formData.dob ? new Date(formData.dob) : null,
        [formData.dob]
    );


    useEffect(() => {
        if (currentAddressIsAddress) {
            setFormData(prev => ({
                ...prev,
                currentAddress: { ...prev.address }
            }));
        }
    }, [currentAddressIsAddress, formData.address]);

    useEffect(() => {
        if (customerNumber && !formData.mobileNo) {
            setFormData(prev => ({
                ...prev,
                mobileNo: customerNumber
            }));
        }
    }, [customerNumber, formData.mobileNo]);

    const fillAddressFromHierarchy = useCallback((type: 'address' | 'currentAddress', area: AreaResponse) => {
        const isThai = language === 'th';

        setFormData(prev => {
            const newData = { ...prev };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const addressData = { ...newData[type] } as any;

            addressData.province = isThai ? area.province_thai : area.province_english;
            addressData.district = isThai ? area.district_thai : area.district_english;
            addressData.subDistrict = isThai ? area.subdistrict_thai : area.subdistrict_english;
            addressData.postalCode = String(area.zip_code);

            newData[type] = addressData;
            return newData;
        });

        setAddressIds(prev => {
            const newIds = { ...prev };
            const typeIds = { ...newIds[type] };

            typeIds.provinceId = String(area.province_id);
            typeIds.districtId = String(area.district_id);
            typeIds.subDistrictId = String(area.subdistrict_id);

            newIds[type] = typeIds;
            return newIds;
        });
    }, [language]);

    const handlePostalCodeBlurByType = useCallback(async (type: 'address' | 'currentAddress', code: string) => {
        if (!code || code.length < 5) return;

        try {
            const subRes = await triggerGetSubDistricts({ search: code }).unwrap();
            if (subRes.data && subRes.data.length > 0) {
                const sub = subRes.data[0];
                const subName = language === 'th' ? sub.name_in_thai : sub.name_in_english;
                const areaRes = await triggerGetArea({ search: subName }).unwrap();
                if (areaRes.data) {
                    const match = areaRes.data.find(a => a.subdistrict_id === sub.id);
                    if (match) {
                        fillAddressFromHierarchy(type, match);
                    }
                }
            }
        } catch (error) {
            console.error("Auto-fill error", error);
        }
    }, [triggerGetSubDistricts, triggerGetArea, language, fillAddressFromHierarchy]);

    const handleAreaChange = useCallback(async (
        type: 'address' | 'currentAddress',
        field: 'province' | 'district' | 'subDistrict',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        option: any
    ) => {
        const isThai = language === 'th';
        const nameValue = isThai ? option.name_in_thai : option.name_in_english;
        const idValue = String(option.id);

        setFormData(prev => {
            const newData = { ...prev };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const addressData = { ...newData[type] } as any;

            addressData[field] = nameValue;

            if (field === 'province') {
                addressData.district = "";
                addressData.subDistrict = "";
                addressData.postalCode = "";
            } else if (field === 'district') {
                addressData.subDistrict = "";
                addressData.postalCode = "";
            } else if (field === 'subDistrict') {
                addressData.postalCode = String(option.zip_code || "");
            }

            newData[type] = addressData;
            return newData;
        });

        setAddressIds(prev => {
            const newIds = { ...prev };
            const typeIds = { ...newIds[type] };

            if (field === 'province') {
                typeIds.provinceId = idValue;
                typeIds.districtId = "";
                typeIds.subDistrictId = "";
            } else if (field === 'district') {
                typeIds.districtId = idValue;
                typeIds.subDistrictId = "";
            } else if (field === 'subDistrict') {
                typeIds.subDistrictId = idValue;
            }

            newIds[type] = typeIds;
            return newIds;
        });

        // Hierarchy Auto-fill Upwards
        if (field === 'district' || field === 'subDistrict') {
            try {
                const searchName = nameValue;
                const areaRes = await triggerGetArea({ search: searchName }).unwrap();
                if (areaRes.data) {
                    let match: AreaResponse | undefined;
                    if (field === 'district') {
                        match = areaRes.data.find(a => a.district_id === option.id);
                        if (match) {
                            setFormData(prev => {
                                const newData = { ...prev };
                                newData[type].province = isThai ? match!.province_thai : match!.province_english;
                                return newData;
                            });
                            setAddressIds(prev => {
                                const newIds = { ...prev };
                                newIds[type].provinceId = String(match!.province_id);
                                return newIds;
                            });
                        }
                    } else if (field === 'subDistrict') {
                        match = areaRes.data.find(a => a.subdistrict_id === option.id);
                        if (match) {
                            setFormData(prev => {
                                const newData = { ...prev };
                                newData[type].province = isThai ? match!.province_thai : match!.province_english;
                                newData[type].district = isThai ? match!.district_thai : match!.district_english;
                                return newData;
                            });
                            setAddressIds(prev => {
                                const newIds = { ...prev };
                                newIds[type].provinceId = String(match!.province_id);
                                newIds[type].districtId = String(match!.district_id);
                                return newIds;
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Hierarchy fetch error", err);
            }
        }
    }, [language, triggerGetArea]);

    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDynamicFormChange = useCallback((data: FormField) => {
        setFormData(prev => ({
            ...prev,
            dynamicForm: data
        }));
    }, []);

    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    if (isFetchingDetails) {
        return <div className="p-10 flex justify-center"><Loading /></div>;
    }

    return (
        <div
            // className="p-4 bg-gray-50 dark:bg-transparent min-h-screen"
            className={`p-4 bg-gray-50 dark:bg-transparent ${!minimal && "min-h-screen"}}`}
        >

            <div className=" max-w-7xl mx-auto">


                {/* Right Column: Information Form */}
                <div className="xl:col-span-2 space-y-6">
                    {formConfig?.photo !== false && !minimal && (
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6 text-center shadow-sm">
                            <div
                                className="text-gray-800 dark:text-white flex items-center justify-between cursor-pointer mb-4"
                                onClick={() => toggleSection('profile')}
                            >
                                <h3 className="font-semibold text-gray-800 dark:text-white uppercase text-xs tracking-wider">
                                    {t("userform.profilePhoto")}
                                </h3>
                                <ChevronUp className={`transition-transform duration-200 ${sectionsOpen.profile ? "" : "-rotate-180"}`} />
                            </div>
                            {sectionsOpen.profile && (
                                <>
                                    {/* A face is identifying. Without `pii.view` the existing
                                        empty-state icon stands in for the photo, and the
                                        upload affordance goes with it — replacing a photo you
                                        are not allowed to see is not a meaningful action. */}
                                    <div className="relative w-40 h-40 mx-auto mb-4 group">
                                        {canEditPii("photo") && (imagePreview || formData.photo) ? (
                                            <img
                                                src={imagePreview || formData.photo}
                                                alt="Profile Preview"
                                                className="w-full h-full rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                                <UserCircleIcon className="w-24 h-24 text-gray-300 dark:text-gray-600" />
                                            </div>
                                        )}
                                        {canEditPii("photo") && (
                                            <label
                                                htmlFor="photo-upload"
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <div className="text-center">
                                                    <CameraIcon className="w-8 h-8 text-white mx-auto" />
                                                    <span className="text-xs text-white mt-1">{t("userform.changePhoto")}</span>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                    <input id="photo-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={!canEditPii("photo")} />
                                    <p className="text-xs text-gray-500 mt-2">{t("userform.allowedTypes")}</p>
                                </>
                            )}
                        </div>
                    )}


                    {/* Personal Information */}
                    {([
                        formConfig?.email, formConfig?.mobileNo, formConfig?.citizenId,
                        formConfig?.title, formConfig?.firstName, formConfig?.middleName,
                        formConfig?.lastName, formConfig?.gender, formConfig?.blood,
                        formConfig?.userType, formConfig?.dob
                    ].some(v => v !== false)) && (
                            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6 shadow-sm">
                                <div
                                    className="text-gray-800 dark:text-white flex items-center justify-between cursor-pointer border-b pb-3 mb-5 dark:border-gray-700 border-gray-200"
                                    onClick={() => toggleSection('personal')}
                                >
                                    <h3 className="font-semibold text-gray-800 dark:text-white">
                                        {t("userform.personal")}
                                    </h3>
                                    <ChevronUp className={`transition-transform duration-200 ${sectionsOpen.personal ? "" : "-rotate-180"}`} />
                                </div>

                                {sectionsOpen.personal && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {(formConfig?.email !== false) && (
                                            <div>
                                                <div className="flex space-x-1">
                                                    <label className={labelClasses}>{t("userform.email")}</label> {REQUIRED_ELEMENT}
                                                </div>
                                                {canEditPii("email") ? <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required/> : <MaskedField path="email" value={formData.email} className={PII_TEXT_CLASSES} />}
                                                {fieldErrors["email"] && (
                                                    <span className="text-red-500 text-xs mt-1 block cursor-default">
                                                        {fieldErrors["email"]}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {(formConfig?.mobileNo !== false) && (
                                            <div>
                                                <div className="flex space-x-1">
                                                    <label className={labelClasses}>{t("forms.phone")}</label> {REQUIRED_ELEMENT}
                                                </div>
                                                {canEditPii("mobileNo") ? <Input name="mobileNo" value={formData.mobileNo || (customerNumber && minimal ? customerNumber : "")} onChange={handleInputChange} required/> : <MaskedField path="mobileNo" value={formData.mobileNo || (customerNumber && minimal ? customerNumber : "")} className={PII_TEXT_CLASSES} />}
                                                {fieldErrors["mobileNo"] && (
                                                    <span className="text-red-500 text-xs mt-1 block cursor-default">
                                                        {fieldErrors["mobileNo"]}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {(formConfig?.citizenId !== false) && !minimal && (
                                            <div >
                                                <label className={labelClasses}>{t("userform.citizenId")}</label>
                                                {/* The text branch shows the raw value, not
                                                    `formatCitizenId(...)`: a redacted id has no
                                                    digits left in the positions the dashes go
                                                    between, so formatting it only garbles it. */}
                                                {canEditPii("citizenId") ? (
                                                    <Input
                                                        name="citizenId"
                                                        value={formatCitizenId(formData.citizenId || "")}
                                                        onChange={handleInputChange}
                                                        maxLength={17}
                                                        placeholder="X-XXXX-XXXXX-XX-X"
                                                    />
                                                ) : (
                                                    <MaskedField path="citizenId" value={formData.citizenId} className={PII_TEXT_CLASSES} />
                                                )}
                                            </div>
                                        )}
                                        {(formConfig?.title !== false) && !minimal && (
                                            <div>
                                                <label className={labelClasses}>{t("userform.title")}</label>
                                                <Select
                                                    value={formData.title}
                                                    onChange={val => handleSelectChange("title", val)}
                                                    options={titleOptions}
                                                    placeholder={t("userform.selectTitle")}
                                                />
                                            </div>
                                        )}
                                        {(formConfig?.firstName !== false) && (
                                            <div >
                                                <label className={labelClasses}>{t("userform.firstName")}</label>
                                                <Input name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                                            </div>
                                        )}
                                        {(formConfig?.middleName !== false) && !minimal && (
                                            <div>
                                                <label className={labelClasses}>{t("userform.middleName")}</label>
                                                <Input name="middleName" value={formData.middleName} onChange={handleInputChange} />
                                            </div>
                                        )}
                                        {(formConfig?.lastName !== false) && (
                                            <div>
                                                <label className={labelClasses}>{t("userform.lastName")}</label>
                                                <Input name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                                            </div>
                                        )}
                                        {(formConfig?.gender !== false) && !minimal && (
                                            <div>
                                                <label className={labelClasses}>{t("userform.gender")}</label>
                                                <Select
                                                    value={formData.gender || ""}
                                                    onChange={val => handleSelectChange("gender", val)}
                                                    options={genderOptions}
                                                    placeholder={t("userform.selectGender")}
                                                    required
                                                />
                                            </div>
                                        )}


                                        {!minimal && (
                                            <div>
                                                <div className="flex space-x-1">
                                                    <label className={labelClasses}>{t("forms.landline")}</label>
                                                </div>
                                                {canEditPii("landline") ? <Input name="landline" value={formData.landline} onChange={handleInputChange} required/> : <MaskedField path="landline" value={formData.landline} className={PII_TEXT_CLASSES} />}
                                            </div>
                                        )}
                                        {(formConfig?.blood !== false) && !minimal && (
                                            <div>
                                                <label className={labelClasses}>{t("userform.blood")}</label>
                                                <Select
                                                    value={formData.blood}
                                                    onChange={val => handleSelectChange("blood", val)}
                                                    options={bloodOptions}
                                                    placeholder={t("userform.selectBlood")}
                                                    required
                                                />
                                            </div>
                                        )}
                                        {(formConfig?.userType !== false) && !minimal && (
                                            <div>
                                                <label className={labelClasses}>{t("common.type")}</label>
                                                <Select
                                                    value={formData.userType?.toString()}
                                                    onChange={val => handleSelectChange("userType", val)}
                                                    options={userTypeOptions}
                                                    required
                                                    placeholder={t("userform.userType")}
                                                />
                                            </div>
                                        )}

                                        {(formConfig?.dob !== false) && !minimal && (
                                            <div className="relative">
                                                <div className=" flex space-x-1">
                                                    <label className={labelClasses}>{t("userform.dob")}</label>
                                                </div>
                                                {/* Text rather than a cleared date picker: the
                                                    picker takes a `Date`, and a redacted date
                                                    is a string (`••/••/1990`) that cannot be
                                                    parsed back into one. `formData.dob` is
                                                    stripped from the payload either way. */}
                                                {canEditPii("dob") ? (
                                                    <DatePickerLocal
                                                        selected={selectedDob}
                                                        onChange={handleDateChange}
                                                        language={language}
                                                        dateFormat="dd/MM/yyyy"
                                                        maxDate={getTodayDate()}
                                                        popperClassName="z-50"
                                                        wrapperClassName="w-full"
                                                        className={`p-2.5 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:bg-gray-900!`}
                                                        placeholderText={t("case.display.schedule_placeholder")}
                                                        locale={language === 'th' ? 'th' : 'en'}
                                                        required
                                                    />
                                                ) : (
                                                    <MaskedField path="dob" value={formData.dob} className={PII_TEXT_CLASSES} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}


                    {/* Address Information */}

                    {(Object.values(formConfig?.address || {}).some(v => v !== false) ||
                        Object.values(formConfig?.currentAddress || {}).some(v => v !== false)) && !minimal && (
                            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6 shadow-sm">
                                <div
                                    className="text-gray-800 dark:text-white flex items-center justify-between cursor-pointer border-b pb-3 mb-5 dark:border-gray-700 border-gray-200"
                                    onClick={() => toggleSection('address')}
                                >
                                    <h3 className="font-semibold text-gray-800 dark:text-white">
                                        {t("userform.address") || "Address Information"}
                                    </h3>
                                    <ChevronUp className={`transition-transform duration-200 ${sectionsOpen.address ? "" : "-rotate-180"}`} />
                                </div>

                                {sectionsOpen.address && (
                                    <>
                                        {/* Registered Address */}
                                        <div className="mb-8">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                                {t("address.registered")}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {(formConfig?.address?.no !== false) && (
                                                    <div>
                                                        <label className={labelClasses}>{t("address.no") || "No."}</label>
                                                        {canEditPii("address.no") ? <Input name="no" value={formData.address.no} onChange={handleAddressChange}/> : <MaskedField path="address.no" value={formData.address.no} className={PII_TEXT_CLASSES} />}
                                                    </div>
                                                )}
                                                {(formConfig?.address?.room !== false) && (
                                                    <div>
                                                        <label className={labelClasses}>{t("address.room") || "Room"}</label>
                                                        {canEditPii("address.room") ? <Input name="room" value={formData.address.room} onChange={handleAddressChange}/> : <MaskedField path="address.room" value={formData.address.room} className={PII_TEXT_CLASSES} />}
                                                    </div>
                                                )}
                                                {(formConfig?.address?.floor !== false) && (
                                                    <div>
                                                        <label className={labelClasses}>{t("address.floor") || "Floor"}</label>
                                                        {canEditPii("address.floor") ? <Input name="floor" value={formData.address.floor} onChange={handleAddressChange}/> : <MaskedField path="address.floor" value={formData.address.floor} className={PII_TEXT_CLASSES} />}
                                                    </div>
                                                )}

                                                {(formConfig?.address?.building !== false) && (
                                                    <div className="md:col-span-2">
                                                        <label className={labelClasses}>{t("address.building") || "Building"}</label>
                                                        {canEditPii("address.building") ? <Input name="building" value={formData.address.building} onChange={handleAddressChange}/> : <MaskedField path="address.building" value={formData.address.building} className={PII_TEXT_CLASSES} />}
                                                    </div>
                                                )}
                                                {(formConfig?.address?.street !== false) && (
                                                    <div>
                                                        <label className={labelClasses}>{t("address.street") || "Street"}</label>
                                                        {canEditPii("address.street") ? <Input name="street" value={formData.address.street} onChange={handleAddressChange}/> : <MaskedField path="address.street" value={formData.address.street} className={PII_TEXT_CLASSES} />}
                                                    </div>
                                                )}

                                                {(formConfig?.address?.province !== false) && (
                                                    <div>
                                                        <label className={labelClasses}>{t("address.province") || "Province"}</label>
                                                        <SearchableSelectApi<Province>
                                                            value={formData.address.province || ""}
                                                            apiQuery={useGetWelcomeProvinceQuery}
                                                            labelKey={language === 'th' ? "name_in_thai" : "name_in_english"}
                                                            valueKey="id"
                                                            onChange={() => { }} // Handled by onChangeObject
                                                            onChangeObject={(opt) => handleAreaChange('address', 'province', opt)}
                                                            placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("address.province")}` || "Select Province"}
                                                            enableApiSearch={true}
                                                            enablePaginate={true}
                                                        />
                                                    </div>
                                                )}
                                                {(formConfig?.address?.district !== false) && (
                                                    <div>
                                                        <label className={labelClasses}>{t("address.district") || "District"}</label>
                                                        <SearchableSelectApi<District>
                                                            value={formData.address.district || ""}
                                                            apiQuery={useGetWelcomeDistrictsQuery}
                                                            queryParams={{ province_id: Number(addressIds.address.provinceId) }}
                                                            labelKey={language === 'th' ? "name_in_thai" : "name_in_english"}
                                                            valueKey="id"
                                                            onChange={() => { }}
                                                            onChangeObject={(opt) => handleAreaChange('address', 'district', opt)}
                                                            placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("address.district")}` || "Select District"}
                                                            // disabled={!addressIds.address.provinceId}
                                                            autoEnterValue={true}
                                                            enableApiSearch={true}
                                                            enablePaginate={true}
                                                        />
                                                    </div>
                                                )}
                                                {(formConfig?.address?.subDistrict !== false) && (
                                                    <div>
                                                        <label className={labelClasses}>{t("address.subDistrict") || "Sub-district"}</label>
                                                        <SearchableSelectApi<Subdistrict>
                                                            value={formData.address.subDistrict || ""}
                                                            apiQuery={useGetWelcomeSubDistrictsQuery}
                                                            queryParams={{ district_id: Number(addressIds.address.districtId), search: formData.address.postalCode }}
                                                            labelKey={language === 'th' ? "name_in_thai" : "name_in_english"}
                                                            valueKey="id"
                                                            onChange={() => { }}
                                                            onChangeObject={(opt) => handleAreaChange('address', 'subDistrict', opt)}
                                                            placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("address.subDistrict")}` || "Select Sub-district"}
                                                            // disabled={!addressIds.address.districtId}
                                                            autoEnterValue={true}
                                                            enableApiSearch={true}
                                                            enablePaginate={true}
                                                        />
                                                    </div>
                                                )}

                                                {(formConfig?.address?.postalCode !== false) && (
                                                    <div className="relative">
                                                        <div className="flex space-x-1">
                                                            <label className={labelClasses}>{t("address.postalCode") || "Postal Code"}</label>
                                                        </div>
                                                        <Input
                                                            name="postalCode"
                                                            value={formData.address.postalCode || ""}
                                                            onChange={handleAddressChange}
                                                            onBlur={(e) => handlePostalCodeBlurByType('address', e.target.value)}
                                                            placeholder={`${t("common.fillData")}${language == "en" ? " " : ""}${t("address.postalCode")}` || "Zip Code"}
                                                        // disabled={!addressIds.address.subDistrictId}
                                                        />
                                                    </div>
                                                )}
                                                {(formConfig?.address?.country !== false) && (
                                                    <div className="md:col-span-2">
                                                        <label className={labelClasses}>{t("address.country") || "Country"}</label>
                                                        <Input name="country" value={formData.address.country} onChange={handleAddressChange} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Current Address Section */}
                                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Checkbox
                                                    checked={currentAddressIsAddress}
                                                    onChange={setCurrentAddressIsAddress}
                                                />
                                                <label className="text-sm text-gray-700 dark:text-gray-300">
                                                    {t("address.sameAsRegistered") || "Current address same as registered address"}
                                                </label>
                                            </div>

                                            {!currentAddressIsAddress && (
                                                <>
                                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                                        {t("address.currentAddress") || "Current Address"}
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        {(formConfig?.currentAddress?.no !== false) && (
                                                            <div>
                                                                <label className={labelClasses}>{t("address.no") || "No."}</label>
                                                                {canEditPii("currentAddress.no") ? <Input name="no" value={formData.currentAddress.no} onChange={handleCurrentAddressChange}/> : <MaskedField path="currentAddress.no" value={formData.currentAddress.no} className={PII_TEXT_CLASSES} />}
                                                            </div>
                                                        )}
                                                        {(formConfig?.currentAddress?.room !== false) && (
                                                            <div>
                                                                <label className={labelClasses}>{t("address.room") || "Room"}</label>
                                                                {canEditPii("currentAddress.room") ? <Input name="room" value={formData.currentAddress.room} onChange={handleCurrentAddressChange}/> : <MaskedField path="currentAddress.room" value={formData.currentAddress.room} className={PII_TEXT_CLASSES} />}
                                                            </div>
                                                        )}
                                                        {(formConfig?.currentAddress?.floor !== false) && (
                                                            <div>
                                                                <label className={labelClasses}>{t("address.floor") || "Floor"}</label>
                                                                {canEditPii("currentAddress.floor") ? <Input name="floor" value={formData.currentAddress.floor} onChange={handleCurrentAddressChange}/> : <MaskedField path="currentAddress.floor" value={formData.currentAddress.floor} className={PII_TEXT_CLASSES} />}
                                                            </div>
                                                        )}

                                                        {(formConfig?.currentAddress?.building !== false) && (
                                                            <div className="md:col-span-2">
                                                                <label className={labelClasses}>{t("address.building") || "Building"}</label>
                                                                {canEditPii("currentAddress.building") ? <Input name="building" value={formData.currentAddress.building} onChange={handleCurrentAddressChange}/> : <MaskedField path="currentAddress.building" value={formData.currentAddress.building} className={PII_TEXT_CLASSES} />}
                                                            </div>
                                                        )}
                                                        {(formConfig?.currentAddress?.street !== false) && (
                                                            <div>
                                                                <label className={labelClasses}>{t("address.street") || "Street"}</label>
                                                                {canEditPii("currentAddress.street") ? <Input name="street" value={formData.currentAddress.street} onChange={handleCurrentAddressChange}/> : <MaskedField path="currentAddress.street" value={formData.currentAddress.street} className={PII_TEXT_CLASSES} />}
                                                            </div>
                                                        )}

                                                        {(formConfig?.currentAddress?.province !== false) && (
                                                            <div>
                                                                <label className={labelClasses}>{t("address.province") || "Province"}</label>
                                                                <SearchableSelectApi<Province>
                                                                    value={formData.currentAddress.province || ""}
                                                                    apiQuery={useGetWelcomeProvinceQuery}
                                                                    labelKey={language === 'th' ? "name_in_thai" : "name_in_english"}
                                                                    valueKey="id"
                                                                    onChange={() => { }}
                                                                    onChangeObject={(opt) => handleAreaChange('currentAddress', 'province', opt)}
                                                                    placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("address.province")}` || "Select Province"}
                                                                    enableApiSearch={true}
                                                                    enablePaginate={true}
                                                                />
                                                            </div>
                                                        )}
                                                        {(formConfig?.currentAddress?.district !== false) && (
                                                            <div>
                                                                <label className={labelClasses}>{t("address.district") || "District"}</label>
                                                                <SearchableSelectApi<District>
                                                                    value={formData.currentAddress.district || ""}
                                                                    apiQuery={useGetWelcomeDistrictsQuery}
                                                                    queryParams={{ province_id: addressIds.address.provinceId }}
                                                                    labelKey={language === 'th' ? "name_in_thai" : "name_in_english"}
                                                                    valueKey="id"
                                                                    onChange={() => { }}
                                                                    onChangeObject={(opt) => handleAreaChange('currentAddress', 'district', opt)}
                                                                    placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("address.district")}` || "Select District"}
                                                                    // disabled={!addressIds.address.provinceId}
                                                                    autoEnterValue={true}
                                                                    enableApiSearch={true}
                                                                    enablePaginate={true}
                                                                />
                                                            </div>
                                                        )}
                                                        {(formConfig?.currentAddress?.subDistrict !== false) && (
                                                            <div>
                                                                <label className={labelClasses}>{t("address.subDistrict") || "Sub-district"}</label>
                                                                <SearchableSelectApi<Subdistrict>
                                                                    value={formData.currentAddress.subDistrict || ""}
                                                                    apiQuery={useGetWelcomeSubDistrictsQuery}
                                                                    queryParams={{ district_id: addressIds.address.districtId, search: formData.currentAddress.postalCode }}
                                                                    labelKey={language === 'th' ? "name_in_thai" : "name_in_english"}
                                                                    valueKey="id"
                                                                    onChange={() => { }}
                                                                    onChangeObject={(opt) => handleAreaChange('currentAddress', 'subDistrict', opt)}
                                                                    placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("address.subDistrict")}` || "Select Sub-district"}
                                                                    // disabled={!addressIds.address.districtId}
                                                                    autoEnterValue={true}
                                                                    enableApiSearch={true}
                                                                    enablePaginate={true}
                                                                />
                                                            </div>
                                                        )}

                                                        {(formConfig?.currentAddress?.postalCode !== false) && (
                                                            <div className="relative">
                                                                <div className="flex space-x-1">
                                                                    <label className={labelClasses}>{t("address.postalCode") || "Postal Code"}</label>
                                                                </div>
                                                                <Input
                                                                    name="postalCode"
                                                                    value={formData.currentAddress.postalCode || ""}
                                                                    onChange={handleCurrentAddressChange}
                                                                    onBlur={(e) => handlePostalCodeBlurByType('currentAddress', e.target.value)}
                                                                    placeholder={`${t("common.fillData")}${language == "en" ? " " : ""}${t("address.postalCode")}` || "Zip Code"}
                                                                // disabled={!addressIds.address.subDistrictId}
                                                                />
                                                            </div>
                                                        )}
                                                        {(formConfig?.currentAddress?.country !== false) && (
                                                            <div className="md:col-span-2">
                                                                <label className={labelClasses}>{t("address.country") || "Country"}</label>
                                                                <Input name="country" value={formData.currentAddress.country} onChange={handleCurrentAddressChange} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}









                    {([
                        formConfig?.contractPreference, formConfig?.languagePreference, formConfig?.note
                    ].some(v => v !== false)) && !minimal && (
                            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6 shadow-sm">
                                <div
                                    className="text-gray-800 dark:text-white flex items-center gap-3 border-b pb-3 mb-5 dark:border-gray-700 border-gray-200 justify-between cursor-pointer"
                                    onClick={() => toggleSection('preferences')}
                                >
                                    <h3 className="font-semibold ">
                                        {t("userform.preferences") || "Preferences"}
                                    </h3>
                                    <ChevronUp className={`transition-transform duration-200 ${sectionsOpen.preferences ? "" : "-rotate-180"}`} />
                                </div>

                                {sectionsOpen.preferences && (
                                    <>
                                        <div className="grid grid-cols-1 gap-6">
                                            {(formConfig?.contractPreference !== false) && (
                                                <div>
                                                    <label className={labelClasses}>{t("case.display.contact_method")}</label>
                                                    <Select
                                                        value={formData.contractPreference || ""}
                                                        onChange={(val) => handleSelectChange("contractPreference", val)}
                                                        options={CONTRACT_PREFERENCE_OPTIONS}
                                                        placeholder={`${t("userform.select_contact")}`}
                                                    />
                                                </div>
                                            )}
                                            {(formConfig?.languagePreference !== false) && (
                                                <div>
                                                    <label className={labelClasses}>{t("common.language") || "Language Preference"}</label>
                                                    <Select
                                                        value={formData.languagePreference || ""}
                                                        onChange={(val) => handleSelectChange("languagePreference", val)}
                                                        options={LANGUAGE_PREFERENCE_OPTIONS}
                                                        placeholder={`${t("common.select")}${language == "en" ? " " : ""}${t("common.language")}`}
                                                    />
                                                </div>
                                            )}

                                            {(formConfig?.note !== false) && (
                                                <div>
                                                    <label className={labelClasses}>{t("common.note") || "Note"}</label>
                                                    <TextAreaWithCounter
                                                        name="note"
                                                        value={formData.note || ""}
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        onChange={(e) => handleInputChange(e as any)}
                                                        placeholder={`${t("common.add")}${language == "en" ? " " : ""}${t("common.note")}`}
                                                        maxLength={100}
                                                        className="w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900  dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800"
                                                    />
                                                </div>
                                            )}
                                        </div>


                                    </>
                                )}

                            </div>
                        )}

                    {/*
                        Contact channels. Not gated on `!minimal`: the cut-down form is the one
                        the case side panel opens, and a case arriving over LINE is precisely
                        when an agent needs to record the identity it arrived on.

                        `!== false` rather than `=== true` so the section still works if the
                        backend's form-config endpoint doesn't persist this new key yet.
                    */}
                    {formConfig?.social !== false && (
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6 shadow-sm">
                            <div
                                className="text-gray-800 dark:text-white flex items-center justify-between cursor-pointer border-b pb-3 mb-5 dark:border-gray-700 border-gray-200"
                                onClick={() => toggleSection('social')}
                            >
                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                    {t("customer.social.channels")}
                                </h3>
                                <ChevronUp className={`transition-transform duration-200 ${sectionsOpen.social ? "" : "-rotate-180"}`} />
                            </div>
                            {sectionsOpen.social && (
                                customer?.id
                                    // Editing: the customer exists, so writes go straight through.
                                    // The dropdown's current value goes with it, so the Primary
                                    // badge and controls follow the channel being chosen rather
                                    // than the one last saved.
                                    ? <SocialAccountManager
                                        customer={editData}
                                        preference={formData.contractPreference}
                                    />
                                    // Creating: nothing to attach to yet, so collect and defer.
                                    : <SocialAccountDraftList
                                        drafts={socialDrafts}
                                        onChange={setSocialDrafts}
                                        lookupIdentity={lookupIdentity}
                                        primaryKey={primaryDraftKey}
                                        onSetPrimary={handleSetPrimaryDraft}
                                        preference={formData.contractPreference}
                                    />
                            )}
                        </div>
                    )}

                    {formConfig?.dynamicFormEnable && !minimal && (
                        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/3 p-6 shadow-sm">
                            <div
                                className="text-gray-800 dark:text-white flex items-center justify-between cursor-pointer border-b pb-3 mb-5 dark:border-gray-700 border-gray-200"
                                onClick={() => toggleSection('specificForm')}
                            >
                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                    {t("userform.specificForm")}
                                </h3>
                                <ChevronUp className={`transition-transform duration-200 ${sectionsOpen.specificForm ? "" : "-rotate-180"}`} />
                            </div>
                            {sectionsOpen.specificForm && (
                                <>
                                    {isFetchingForm ? (
                                        <div className="flex justify-center py-6">
                                            <Loading />
                                        </div>
                                    ) : formError ? (
                                        <div className="p-4 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            {t("common.error")}
                                        </div>
                                    ) : (
                                        <DynamicForm
                                            initialForm={
                                                (editData?.dynamicForm?.formId === selectedFormRes?.data?.formId &&
                                                    editData?.dynamicForm?.versions === selectedFormRes?.data?.versions)
                                                    ? editData?.dynamicForm
                                                    : selectedFormRes?.data
                                            }
                                            edit={false}
                                            editFormData={true}
                                            enableFormTitle={false}
                                            enableSelfBg={false}
                                            onFormChange={handleDynamicFormChange}
                                            maskPii
                                            // On create, unlock everything — there is no stored value to
                                            // withhold. On edit, undefined lets each field resolve its own class.
                                            canViewPii={isExistingCustomer ? undefined : true}
                                        // onFormChange={handleGetTypeFormData}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    {/* Save Button */}
                    <div className=" border-gray-100 dark:border-gray-700 flex justify-end">

                        <button
                            onClick={handleSubmit}
                            disabled={isAddingCustomer || isUploading || isUpdatingCustomer}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAddingCustomer || isUploading || isUpdatingCustomer ? t("common.saving") || "Saving..." : t("common.save")}
                        </button>

                    </div>
                </div>
            </div>
        </div >

    );
};

export default React.memo(CustomerCreate);