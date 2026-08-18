import { IndividualFormFieldWithChildren, IndividualFormField, FormField } from "@/cms/components/interface/FormField";

export const validateFieldValue = (field: IndividualFormFieldWithChildren): string[] => {
  const errors: string[] = [];
  const { value, formRule, required, label, type } = field;

  // Rule 1: Check if a required field is empty
  if (required) {
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      errors.push(``);
      return errors;
    }
  }

  const isEffectivelyEmpty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
  if (!required && isEffectivelyEmpty) {
    return [];
  }

  if (!formRule) {
    return [];
  }

  if (typeof value === 'string' && value) {
    if (formRule.minLength !== undefined && value.length < formRule.minLength) errors.push(`'${label}' must have at least ${formRule.minLength} characters.`);
    if (formRule.maxLength !== undefined && value.length > formRule.maxLength) errors.push(`'${label}' must have at most ${formRule.maxLength} characters.`);
    if (formRule.contain && !value.includes(formRule.contain)) errors.push(`'${label}' must contain the text "${formRule.contain}".`);
    if (formRule.validEmailFormat && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`'${label}' must be a valid email address.`);
    if (formRule.hasUppercase && !/[A-Z]/.test(value)) errors.push(`'${label}' must contain an uppercase letter.`);
    if (formRule.hasLowercase && !/[a-z]/.test(value)) errors.push(`'${label}' must contain a lowercase letter.`);
    if (formRule.hasNumber && !/\d/.test(value)) errors.push(`'${label}' must contain a number.`);
    if (formRule.hasSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.push(`'${label}' must contain a special character.`);
    if (formRule.noWhitespace && /\s/.test(value)) errors.push(`'${label}' must not contain whitespace.`);
  }

  if (typeof value === 'number') {
    if (formRule.minnumber !== undefined && value < formRule.minnumber) errors.push(`'${label}' must be at least ${formRule.minnumber}.`);
    if (formRule.maxnumber !== undefined && value > formRule.maxnumber) errors.push(`'${label}' must be at most ${formRule.maxnumber}.`);
  }

  if (Array.isArray(value) && type === 'option') {
    if (formRule.minSelections !== undefined && value.length < formRule.minSelections) errors.push(`For '${label}', you must select at least ${formRule.minSelections} options.`);
    if (formRule.maxSelections !== undefined && value.length > formRule.maxSelections) errors.push(`For '${label}', you can select at most ${formRule.maxSelections} options.`);
  }

  if ((type === 'dateInput' || type === 'dateLocal') && typeof value === 'string' && value) {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formRule.minDate && selectedDate < new Date(formRule.minDate)) errors.push(`'${label}' cannot be earlier than ${formRule.minDate}.`);
    if (formRule.maxDate && selectedDate > new Date(formRule.maxDate)) errors.push(`'${label}' cannot be later than ${formRule.maxDate}.`);
    if (formRule.pastDateOnly && selectedDate >= today) errors.push(`'${label}' must be a date in the past.`);
    if (formRule.futureDateOnly && selectedDate <= today) errors.push(`'${label}' must be a date in the future.`);
  }

  if (value instanceof File) {
    if (formRule.maxFileSize && (value.size / 1024 / 1024) > formRule.maxFileSize) errors.push(`File for '${label}' exceeds the max size of ${formRule.maxFileSize}MB.`);
    if (formRule.allowedFileTypes?.length && !formRule.allowedFileTypes.includes(value.type)) errors.push(`Invalid file type for '${label}'.`);
  }

  if (Array.isArray(value) && (type === 'multiImage' || type === 'dndMultiImage')) {
    if (formRule.minFiles !== undefined && value.length < formRule.minFiles) {
      errors.push(`'${label}' requires at least ${formRule.minFiles} files.`);
    }
    if (formRule.maxFiles !== undefined && value.length > formRule.maxFiles) {
      errors.push(`'${label}' allows at most ${formRule.maxFiles} files.`);
    }

    if (errors.length > 0) return errors;

    for (const file of value) {
      if (file instanceof File) {
        if (formRule.maxFileSize && (file.size / 1024 / 1024) > formRule.maxFileSize) {
          errors.push(`A file in '${label}' exceeds ${formRule.maxFileSize}MB.`);
          break;
        }
        if (formRule.allowedFileTypes?.length && !formRule.allowedFileTypes.includes(file.type)) {
          errors.push(`A file in '${label}' has an invalid type.`);
          break;
        }
      }
    }
  }

  return errors;
};


export const validateDynamicFormInput = (form: FormField): boolean => {
  const validateFields = (fields: IndividualFormField[]): boolean => {
    if (!fields) {
      return true
    }
    for (const field of fields) {
      const fieldWithChildren = field as IndividualFormFieldWithChildren;

      if (validateFieldValue(fieldWithChildren).length > 0) {
        return false;
      }
      if (field.type === "InputGroup" && Array.isArray(field.value)) {
        if (!validateFields(field.value)) {
          return false;
        }
      }
      if (field.type === "dynamicField" && Array.isArray(field.options)) {
        const selectedOption = field.options.find(opt => opt.value === field.value);
        if (selectedOption && Array.isArray(selectedOption.form)) {
          if (!validateFields(selectedOption.form)) {
            return false;
          }
        }
      }
    }
    return true;
  };
  return validateFields(form.formFieldJson);
};