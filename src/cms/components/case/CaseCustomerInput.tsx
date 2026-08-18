import { Custommer } from "@/cms/types";
import { ChangeEvent } from "react";
// import { SearchableSelect } from "../SearchSelectInput/SearchSelectInput";
import { Customer } from "@/cms/store/api/custommerApi";
import { useTranslation } from "@/core/hooks/useTranslation";
import { COMMON_INPUT_CSS } from "./constants/caseConstants";
// import { contractMethodMock } from "./source";

interface CustomerInputProps {
    customerData: Custommer
    listCustomerData: Customer[];
    handleCustomerDataChange: (newValue: Custommer) => void;
    hidePhone?: boolean
}

const CustomerInput: React.FC<CustomerInputProps> = ({
    customerData,
    listCustomerData,
    handleCustomerDataChange,
    hidePhone = false
}) => {
    const { t } = useTranslation();

    // const handleCustomerDataNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    //     handleCustomerDataChange({
    //         ...customerData,
    //         name: e.target.value
    //     });
    // };



    // const handleCustomerDataContractMethodeChange = (data: contractMethod) => {
    //     handleCustomerDataChange({ ...customerData, contractMethod: data });
    // };
    const handleCustomerDataPhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (customerData.id) {
            // A customer is already linked (via "Link existing customer" / "Add new
            // customer") - this field edits the case's contact number only. It must
            // never re-target or clear that link, even if the typed number matches
            // a different cached customer.
            handleCustomerDataChange({ ...customerData, mobileNo: value });
            return;
        }

        if (value !== "") {
            const matchingCustomer = listCustomerData.find(
                (customer) => customer.mobileNo === value
            );
            if (matchingCustomer) {
                handleCustomerDataChange({
                    ...matchingCustomer,
                    name: `${matchingCustomer.firstName} ${matchingCustomer.lastName}`,
                    email: matchingCustomer.email,
                    photo: matchingCustomer.photo,
                    id: matchingCustomer.id,
                });
                return;
            }
        }
        // No local match (or the field was cleared): drop any previously
        // resolved customer (id/name/email/photo/etc.) so downstream phone-based
        // lookups (side panel, submit-time fallback) re-run against this new
        // value instead of staying pinned to the old linked/added customer.
        handleCustomerDataChange({ mobileNo: value } as Custommer);
    };

    // const handleCustomerEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    //     const value = e.target.value === "" ? "" : e.target.value;
    //     handleCustomerDataChange({ ...customerData, email: value });
    // };

    return (
        <div className="mx-3 text-gray-900 dark:text-gray-400">
            {/* <div className="w-auto md:mr-2">
                <h3 className="mb-2 ">Customer Name :</h3>
                <input
                    value={customerData.name}
                    onChange={(e) => { handleCustomerDataNameChange(e) }}
                    className={`${commonInputCss}`}
                    placeholder={"Enter Customer Name"}
                />
            </div> */}
            {!hidePhone &&
                <div
                    // className={`w-auto md:mr-2`}
                    className={`w-auto md:mr-0`}
                >
                    <h3 className="my-2 ">{t("case.display.phone_number")} :</h3>
                    <input
                        value={customerData.mobileNo ?? ""}
                        onChange={(e) => { handleCustomerDataPhoneChange(e) }}
                        className={`${COMMON_INPUT_CSS}`}
                        placeholder={t("case.display.phone_number_placeholder")}
                    />
                </div>}
            {/* <div className="w-auto md:mr-2">
                <h3 className="my-2">Contact Method : <span className=" text-red-500 text-sm font-bold">*</span></h3>
                <SearchableSelect
                    options={contractMethodMock.map(m => m.name)}
                    className="sm:my-3"
                    value={customerData.contractMethod?.name ?? ""}
                    onChange={(selectedName) => {
                        const selectedMethod = contractMethodMock.find(
                            (method) => method.name === selectedName
                        );
                        if (selectedMethod) {
                            handleCustomerDataContractMethodeChange(selectedMethod);
                        }
                    }}
                />
            </div> */}
            {/* {customerData.contractMethod?.name === "Email" &&
                <div className="w-auto md:mr-2  ">
                    <h3 className="my-2">Customer Email : <span className=" text-red-500 text-sm font-bold">*</span></h3>
                    <input
                        type="email"
                        onChange={handleCustomerEmailChange}
                        value={customerData.email || ""}
                        placeholder="Enter Email"
                        className={COMMON_INPUT_CSS}
                        required={true}
                    />
                </div>
            } */}
        </div>
    );
};

export default CustomerInput