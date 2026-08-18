// src/cms/components/case/LinkingExistingCustomer.tsx
import React, { useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { usePatchUpdateCaseCustomerMutation } from "@/cms/store/api/caseApi";
import { Customer, CustomerProduct } from "@/cms/store/api/custommerApi";
import type { CaseDetails } from "@/cms/types/case";
import { CustomerSearchPicker } from "@/cms/components/customer/CustomerSearchPicker";
import { useToastContext } from "@/core/components/crud/ToastGlobal";

export interface CustomerLinkProps {
  caseWorkOrderNumber?: string;
  setCaseState?: React.Dispatch<React.SetStateAction<CaseDetails | undefined>>;
  setOpenLinkCustomerModal?: React.Dispatch<React.SetStateAction<boolean>>;
  isCreate?: boolean;
}

/**
 * Attach an existing customer to this case.
 *
 * The directory search itself lives in `CustomerSearchPicker`, shared with the flow that
 * links a social identity to a customer. What stays here is everything specific to the
 * case: persisting the link, and the rules about the case's own phone field.
 */
const LinkingExistingCustomer: React.FC<CustomerLinkProps> = ({ caseWorkOrderNumber, setCaseState, setOpenLinkCustomerModal, isCreate }) => {
  const [updateCaseCustomer] = usePatchUpdateCaseCustomerMutation();
  const { t } = useTranslation();
  const { addToast } = useToastContext();

  const [isLinking, setIsLinking] = useState<boolean>(false);

  const handleUpdateCaseCustomer = async (id: string, customerId: number) => {
    await updateCaseCustomer({ id: id, customerId: customerId }).unwrap();
  }

  const handleOnLink = async (customer: CustomerProduct) => {
    if (isLinking) return;

    const linkedCustomerState = { ...customer } as Partial<CustomerProduct>;

    // Persist the link to the backend first (when the case already exists) so the
    // UI never shows an optimistic "linked" state that the server rejected. This
    // also keeps the mutation out of the setCaseState updater below, since updater
    // functions must stay pure (React StrictMode double-invokes them in dev, which
    // was firing this request twice).
    if (caseWorkOrderNumber) {
      setIsLinking(true);
      try {
        await handleUpdateCaseCustomer(caseWorkOrderNumber, Number(linkedCustomerState?.id));
      } catch (error) {
        console.error("Failed to link customer to case:", error);
        addToast("error", t("common.error"));
        setIsLinking(false);
        return;
      }
      setIsLinking(false);
    }

    setOpenLinkCustomerModal?.(false);
    setCaseState?.((prev: CaseDetails | undefined) => {
      if (!prev) {
        return prev;
      }

      const mergedCustomer = { ...linkedCustomerState };
      // In the create-case flow the phone number field is user-owned - linking a
      // customer must never overwrite it, whether it's currently blank or already
      // filled in. Outside create, only preserve it when the agent already typed one.
      if (isCreate || prev?.customerData?.mobileNo) {
        delete mergedCustomer.mobileNo;
      }

      return {
        ...prev,
        customerData: {
          ...prev?.customerData,
          ...(mergedCustomer as unknown as Customer),
          name: mergedCustomer?.displayName || ""
        }
      };
    });
  };

  return <CustomerSearchPicker onSelect={handleOnLink} />;
};

export default LinkingExistingCustomer;
