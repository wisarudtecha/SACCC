import CustomerInput from "@/cms/components/case/CaseCustomerInput";
import { CaseSocialIdentityInput } from "@/cms/components/case/formFields/CaseSocialIdentityInput";
import { Customer } from "@/cms/store/api/custommerApi";
import { Custommer } from "@/cms/types";
import { CaseFieldSectionProps } from "./types";

interface CaseCustomerSectionProps extends CaseFieldSectionProps {
    listCustomerData: Customer[];
    hidePhone?: boolean;
}

/**
 * How to reach the customer on this case: the phone number, plus the social account the
 * case arrived on when the contact method is a social channel.
 *
 * `CaseSocialIdentityInput` renders nothing for non-social sources, so this is unchanged
 * for every existing contact method.
 */
export const CaseCustomerSection = ({
    caseState,
    onCaseChange,
    listCustomerData,
    hidePhone = false,
}: CaseCustomerSectionProps) => (
    <>
        <CustomerInput
            listCustomerData={listCustomerData}
            hidePhone={hidePhone}
            handleCustomerDataChange={(data: Custommer) => onCaseChange({ customerData: data })}
            customerData={caseState?.customerData || {} as Custommer}
        />
        <CaseSocialIdentityInput caseState={caseState} onCaseChange={onCaseChange} />
    </>
);
