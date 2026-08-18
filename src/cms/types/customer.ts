import { FormField, GetFormResponse } from "@/cms/components/interface/FormField";

export interface AddressConfig {
    building: boolean;
    country: boolean;
    district: boolean;
    floor: boolean;
    lat: boolean;
    lon: boolean;
    no: boolean;
    postalCode: boolean;
    province: boolean;
    road: boolean;
    room: boolean;
    street: boolean;
    subDistrict: boolean;
}




export interface CustomerFormConfigType {
    displayName: boolean;
    title: boolean;
    firstName: boolean;
    middleName: boolean;
    lastName: boolean;
    citizenId: boolean;
    dob: boolean;
    blood: boolean;
    gender: boolean;
    mobileNo: boolean;
    address: AddressConfig;
    photo: boolean;
    email: boolean;
    userType: boolean;
    note: boolean;
    languagePreference: boolean;
    contractPreference: boolean;
    /**
     * Whether the contact-channels section is offered on the customer form.
     *
     * Optional because the backend's `/customer_form_config` may not persist this key yet.
     * Every consumer therefore tests `!== false`, so an absent value means "shown" and the
     * feature does not depend on a backend change to be usable.
     */
    social?: boolean;
    currentAddress: AddressConfig;
    dynamicForm?: GetFormResponse;
    dynamicFormEnable:boolean
}


export interface AddCustomer {
    active: boolean;
    currentAddress: {
        no?: string;
        lat?: string;
        lon?: string;
        road?: string;
        room?: string;
        floor?: string;
        street?: string;
        country?: string;
        building?: string;
        district?: string;
        province?: string;
        postalCode?: string;
        subDistrict?: string;
    };
    address: {
        no?: string;
        lat?: string;
        lon?: string;
        road?: string;
        room?: string;
        floor?: string;
        street?: string;
        country?: string;
        building?: string;
        district?: string;
        province?: string;
        postalCode?: string;
        subDistrict?: string;
    };
    blood?: string;
    citizenId: string;
    displayName: string;
    dob: string | null;
    email: string;
    firstName?: string;
    gender: string | null;
    lastName?: string;
    landline?: string;
    middleName?: string;
    mobileNo: string;
    photo: string;
    title: string;
    userType: string | null;
    note?: string;
    languagePreference?: string;
    contractPreference?: string;
    dynamicForm?:FormField | null
}