import { useState } from "react";

interface SwitchProps {
  label: string;
  /** Uncontrolled initial state. Ignored when `checked` is provided. */
  defaultChecked?: boolean;
  /**
   * Controlled state. When supplied, the switch renders from this value and stops
   * tracking its own - needed for toggles that must reflect async-loaded data or
   * a Cancel-triggered reset. Omit it to keep the original uncontrolled
   * (`defaultChecked`) behaviour.
   */
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  onChick?:()=>void;
  color?: "blue" | "gray"; // Added prop to toggle color theme
}

const Switch: React.FC<SwitchProps> = ({
  label,
  defaultChecked = false,
  checked,
  disabled = false,
  onChange,
  color = "blue", // Default to blue color
  onChick
}) => {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    const newCheckedState = !isChecked;
    if (!isControlled) {
      setInternalChecked(newCheckedState);
    }
    if (onChange) {
      onChange(newCheckedState);
    }
  };

  const switchColors =
    color === "blue"
      ? {
          background: isChecked
            ? "bg-brand-500 "
            : "bg-gray-200 dark:bg-white/10", // Blue version
          knob: isChecked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        }
      : {
          background: isChecked
            ? "bg-gray-800 dark:bg-white/10"
            : "bg-gray-200 dark:bg-white/10", // Gray version
          knob: isChecked
            ? "translate-x-full bg-white"
            : "translate-x-0 bg-white",
        };

  return (
    <label
      className={`flex cursor-pointer select-none items-center gap-3 text-sm font-medium ${
        disabled ? "text-gray-400" : "text-gray-700 dark:text-gray-400"
      }`}
      onClick={() => {
        // A <label> never fires a native "change" event on its own, so the toggle must
        // happen on click; onChick is preserved as an additional external hook for callers
        // (e.g. ButtonAction.tsx) that relied on it firing on click.
        handleToggle();
        onChick?.();
      }}
    >
      {label}
      <div className="relative">
        <div
          className={`block transition duration-150 ease-linear h-6 w-11 rounded-full ${
            disabled
              ? "bg-gray-100 pointer-events-none dark:bg-gray-800"
              : switchColors.background
          }`}
        ></div>
        <div
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm duration-150 ease-linear transform ${switchColors.knob}`}
        ></div>
      </div>

    </label>
  );
};

export default Switch;
