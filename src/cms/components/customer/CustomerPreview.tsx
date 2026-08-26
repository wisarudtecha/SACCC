import { Globe, Heart, Mail, MapPin, NotebookPen, Phone } from "lucide-react";
import Button from "@/core/components/ui/button/Button";
import FormViewer from "../form/dynamic-form/FormViewValue";
import { i18nUserType } from "./constant";
import Badge from "@/core/components/ui/badge/Badge";
import { Customer, mergeAddress, useGetCustomerFormConfigQuery } from "@/cms/store/api/custommerApi";
import { useCustomerSocials } from "@/cms/hooks/useCustomerSocials";
import { useCustomerPrimaryContact } from "@/cms/hooks/useCustomerPrimaryContact";
import { resolvePrimaryChannelDisplay } from "@/cms/utils/customerSocial.policy";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePiiMasker } from "@/core/hooks/useMaskedValue";
import { ChatIcon } from "@/core/icons";
import { Avatar } from "@/core/components/ui/avatar/Avatarv2";

export const CustomerPreviewData = ({ customer, className }: { customer: Customer | undefined, className?: string }) => {
    const { t } = useTranslation();
    const { data: formConfigRes } = useGetCustomerFormConfigQuery();
    const formConfig = formConfigRes?.data;
    const { canViewField, maskAddress, maskValue } = usePiiMasker();

    // The preference alone ("CALL") does not tell an agent which number to dial, so the
    // stored primary's actual value is shown beneath it. Both reads share their RTK Query
    // cache entries with the contact-channel list, so this costs no extra round-trip on the
    // surfaces that render both.
    const { socials } = useCustomerSocials({ customerId: customer?.id });
    const { primaryKey } = useCustomerPrimaryContact({ customer, socials });
    const primaryChannel = resolvePrimaryChannelDisplay(customer, socials, primaryKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAddressConfigured = (config: any) => {
        if (!config) return true;
        return Object.values(config).some(val => val === true);
    };
    
    // Masked before merging, not after: `mergeAddress` flattens the object into one string,
    // so once it has run there is no seam left to redact the house number without also
    // taking out the province. The coarse parts survive either way.
    const maskedCurrentAddress = maskAddress(customer?.currentAddress, "currentAddress");
    const maskedRegisAddress = maskAddress(customer?.address, "address");

    const currentAddress = maskedCurrentAddress ? mergeAddress(maskedCurrentAddress, formConfig?.currentAddress) : ""
    const regisAddress = maskedRegisAddress ? mergeAddress(maskedRegisAddress, formConfig?.address) : ""

    return (
        <div className={`h-full border-b-2 md:border-b-0 md:border-r-2 border-gray-200 dark:border-gray-800 xl:px-10 xl:py-12 px-5 py-7 ${className}`}>

            {/* Avatar & Display Name */}
            {(formConfig?.photo !== false || formConfig?.displayName !== false) && (
                <div className='justify-items-center text-center my-5 mx-3'>
                    {formConfig?.photo !== false && (
                        // A face is identifying, so without the sensitive-PII permission fall
                        // through to the initials the component already renders for customers
                        // with no photo — a mask string in `src` would only produce a broken
                        // image.
                        canViewField("photo") && customer?.photo ? (
                            <Avatar className="w-30 h-30 justify-center items-center">
                                <img src={customer?.photo} alt={customer?.displayName} className="h-full w-full object-cover rounded-full" />
                            </Avatar>
                        ) : (
                            <div className="w-30 h-30 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                                <span className="w-20 text-center uppercase">
                                    {(customer?.firstName?.[0] || "") + (customer?.lastName?.[0] || "")}
                                </span>
                            </div>
                        )
                    )}
                    {formConfig?.displayName !== false && (
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-45">
                            {customer?.displayName}
                        </span>
                    )}
                </div>
            )}

            {/* User Type Badge */}
            {formConfig?.userType !== false && (
                <div className='justify-items-center text-center my-5 space-y-3'>
                    <Badge variant="outline">
                        {customer?.userType ? i18nUserType(t, customer.userType) : t("userform.na")}
                    </Badge>
                </div>
            )}

            {/* Quick Action Buttons */}
            {(formConfig?.mobileNo !== false || formConfig?.email !== false) && (
                <div className='justify-items-center text-center my-5 space-y-3'>
                    <div className="space-x-1 space-y-2 m-1">
                        {formConfig?.mobileNo !== false && (
                            <Button className="bg-green-500 hover:bg-green-600" size="md">
                                <Phone className="w-5 h-5" />
                            </Button>
                        )}
                        {formConfig?.email !== false && (
                            <Button className="bg-blue-500 hover:bg-blue-600" size="md">
                                <Mail className="w-5 h-5" />
                            </Button>
                        )}
                        <Button className="bg-blue-500 hover:bg-blue-600" size="md">
                            <ChatIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Address */}
            {(isAddressConfigured(formConfig?.address) || isAddressConfigured(formConfig?.currentAddress)) && (
                <div className='my-3 mx-3 space-y-3'>
                    <div className='flex items-center text-gray-600 dark:text-gray-300 space-x-2'>
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t("common.address")}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 text-gray-600 dark:text-gray-300">
                        {/* Current Address Group */}
                        {isAddressConfigured(formConfig?.currentAddress) && (
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold dark:text-gray-300">
                                    {t("address.currentAddress")}
                                </span>
                                <div className="text-sm leading-relaxed text-gray-400">
                                    {customer?.currentAddress ? (
                                        customer.address && currentAddress === regisAddress && currentAddress != "" ? (
                                            <div>{t("address.sameAsRegistered")}</div>
                                        ) : (
                                            currentAddress != "" ? currentAddress: "-"
                                        )
                                    ) : "-"}
                                </div>
                            </div>
                        )}

                        {/* Registered Address Group */}
                        {isAddressConfigured(formConfig?.address) && (
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold dark:text-gray-300">
                                    {t("address.registered")}
                                </span>
                                <p className="text-sm leading-relaxed text-gray-400">
                                    { regisAddress != "" ? regisAddress: "-"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Preferences */}
            {(formConfig?.contractPreference !== false || formConfig?.languagePreference !== false) && (
                <div className='my-3 mx-3 space-y-3'>
                    <div className='flex items-center text-gray-600 dark:text-gray-300 space-x-2'>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t("userform.preferences")}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 text-gray-600 dark:text-gray-300">
                        {formConfig?.contractPreference !== false && (
                            <div className="flex flex-col">
                                <div className="flex space-x-1">
                                    <Heart className="w-4 h-4" />
                                    <span className="text-sm font-semibold dark:text-gray-300 uppercase">
                                        {t("common.contact")}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-gray-400">
                                    {customer?.contractPreference || "-"}
                                </p>
                                {primaryChannel && (
                                    <p className="text-sm leading-relaxed text-gray-400 break-all">
                                        {maskValue(primaryChannel.piiPath, primaryChannel.value)}
                                    </p>
                                )}
                            </div>
                        )}

                        {formConfig?.languagePreference !== false && (
                            <div className="flex flex-col">
                                <div className="flex space-x-1">
                                    <Globe className="w-4 h-4" />
                                    <span className="text-sm font-semibold dark:text-gray-300">
                                        {t("common.language")}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-gray-400">
                                    {customer?.languagePreference || "-"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Specific Form */}
            {customer?.dynamicForm && formConfig?.dynamicForm && (
                <div className='mx-3'>
                    <div className='flex items-center text-gray-600 dark:text-gray-300 space-x-2'>
                        <NotebookPen className="w-4 h-4" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {t("userform.specificForm")}
                        </span>
                    </div>

                    <div className="mx-3 grid grid-cols-1 text-gray-600 dark:text-gray-300">
                        <FormViewer formData={customer.dynamicForm} disbleRequireElement maskPii />
                    </div>
                </div>
            )}

        </div>
    );
};
