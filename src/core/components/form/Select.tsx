import { useEffect, useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  // onChange: (value: string) => void;
  onChange: (value: string) => void;
  // onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; // Changed: now passes the event
  className?: string;
  // defaultValue?: string;
  value?: string;
  disabled?: boolean;
  multiple?: boolean;
  required?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  // defaultValue = "",
  value = "",
  disabled = false,
  multiple = false,
  required = false
}) => {
  // Manage the selected value
  // const [selectedValue, setSelectedValue] = useState<string>(defaultValue);

  // Use controlled component pattern - sync with external value
  // const [selectedValue, setSelectedValue] = useState<string>(value);
  const [selectedValue, setSelectedValue] = useState<string | string[]>(
    multiple ? ([] as string[]) : ""
  );

  // Update internal state when external value changes
  useEffect(() => {
    // setSelectedValue(value);
    setSelectedValue(value ?? (multiple ? [] : ""));
  }, [
    value,
    multiple
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // const value = e.target.value;
    // const newValue = e.target.value;
    const newValue = multiple
      ? Array.from(e.target.selectedOptions, (option) => option.value)
      : e.target.value;
    // setSelectedValue(value);
    setSelectedValue(newValue);
    // onChange(value); // Trigger parent handler
    // onChange(e); // Changed: pass the entire event object instead of just value
    onChange(newValue as string); // Pass the value directly to parent
  };

  return (
    <select
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
        selectedValue
          ? "text-gray-800 dark:text-white/90"
          : "text-gray-400 dark:text-gray-400"
        } ${multiple ? "min-h-64" : "h-11"} ${className}`}
      value={selectedValue}
      onChange={handleChange}
      // defaultValue={defaultValue}
      disabled={disabled}
      multiple={multiple}
      required={required}
    >
      {/* Placeholder option */}
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>
      {/* Map over options */}
      {options.map((option) => (
        <option
          // key={option.value}
          key={`${option.value}-${Math.random().toString(36).slice(2, 9)}`}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
