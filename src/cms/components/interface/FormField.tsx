import { CaseTypeSubType } from "./CaseType";
import type { PiiRule } from "@/core/security/piiFields";

export interface IndividualFormField {
  id: string;
  label: string;
  showLabel?: boolean;
  type: string;
  value: any;
  enableSearch?: boolean
  options?: any[];
  placeholder?: string;
  required: boolean;
  colSpan?: number;
  isChild?: boolean;
  GroupColSpan?: number;
  DynamicFieldColSpan?: number;
  formRule?: FormRule
  /**
   * Marks this field as customer personal data, and how to mask it.
   *
   * Only enforced where a render site explicitly opts in via `maskPii` (`FormViewer`,
   * `DynamicForm`) — a case-type form or SOP answer using the same field definition renders
   * it unmasked, on purpose. See `src/core/security/piiFields.ts`.
   */
  pii?: PiiRule;
}

export interface FormRule {
  maxLength?: number;
  minLength?: number;
  contain?: string;
  maxnumber?: number;
  minnumber?: number;
  validEmailFormat?: boolean;
  maxSelections?: number;
  minSelections?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  allowedCountries?: string[];
  hasUppercase?: boolean;
  hasLowercase?: boolean;
  hasNumber?: boolean;
  hasSpecialChar?: boolean;
  noWhitespace?: boolean;
  minDate?: string;
  maxDate?: string;
  minLocalDate?: string
  maxLocalDate?: string
  futureDateOnly?: boolean;
  pastDateOnly?: boolean;
  minFiles?: number;
  maxFiles?: number;
}

export interface IndividualFormFieldWithChildren extends IndividualFormField {
  value: any | IndividualFormFieldWithChildren[];
  options?: Array<any | { value: string; form: IndividualFormFieldWithChildren[] }>;
}

export interface FormField {
  formId: string;
  formName: string;
  formColSpan: number;
  formFieldJson: IndividualFormField[];
  formType: string;
  version?:string;
}

export interface GetFormResponse{
    formId: string;     
    formName: string;   
    publish: boolean;   
    versions: string;   
}

export interface FormFieldWithNode extends FormField {
  versions: string;
  nextNodeId: string;
  wfId: string;
}

export interface FormFieldWithChildren extends FormField {
  formFieldJson: IndividualFormFieldWithChildren[];
}

export interface FormConfigItem {
  formType: string;
  title: string;
  options?: any[];
  canBeChild?: boolean;
  property?: string[];
}

export interface versionList {
  version: string
  publish: boolean
}


export interface formMetaData {
  currentVersions: string,
  selectVersion: string,
  publish: boolean,
  versionsInfoList: versionList[]
}


export interface FormManager extends FormField {
  active: boolean;
  publish: boolean;
  versions: string;
  createdAt: string;
  type?: string;
  createdBy: string
  versionsInfoList?: versionList[]
  workflows?: FormLinkWf[]
}


export interface GetFormByIdResponse extends FormField {
  active: boolean;
  publish: boolean;
  versions: string;
  createdAt: string;
  type?: string;
  createdBy: string
  versionsInfoList?: versionList[]
}

export interface FormLinkWf {
  formId: string,
  wfId: string,
  title: string
}

export interface formType extends CaseTypeSubType {
  formField: FormFieldWithNode
  caseType: string
}

export interface CustomerData {
  customerName: string;
  contractMethod: "Email" | "Chat" | "Iot Alert" | "Phone Number" | "";
  phoneNumber?: number;
  email?: string;
}