// src/cms/utils/customerPayload.ts
/**
 * Turning a stored `Customer` back into the `AddCustomer` shape its own update endpoint
 * expects.
 *
 * `PATCH /customer/:id` takes the same body as create, and it is not documented whether it
 * merges or replaces. Sending a partial body is therefore a data-loss risk — a write that
 * only carried `email` could blank an address. Every caller that needs to change one field
 * does a read-modify-write through this mapper instead of guessing.
 *
 * `CustomerCreate.tsx` performs the same mapping inline when it loads a customer for
 * editing; that copy is left alone here rather than refactored underneath a form this
 * change does not otherwise touch.
 */
import type { Customer } from "@/cms/store/api/custommerApi";
import type { AddCustomer } from "@/cms/types/customer";

export const toAddCustomerPayload = (customer: Customer): AddCustomer => ({
  active: customer.active,
  address: { ...customer.address },
  currentAddress: { ...(customer.currentAddress ?? customer.address) },
  blood: customer.blood,
  citizenId: customer.citizenId,
  displayName: customer.displayName,
  dob: customer.dob || null,
  email: customer.email,
  firstName: customer.firstName,
  gender: customer.gender,
  lastName: customer.lastName,
  landline: customer.landline,
  middleName: customer.middleName,
  mobileNo: customer.mobileNo,
  photo: customer.photo,
  title: customer.title,
  userType: customer.userType || null,
  note: customer.note,
  languagePreference: customer.languagePreference,
  contractPreference: customer.contractPreference,
  dynamicForm: customer.dynamicForm ?? null,
});
