// The one button used by both assignment actions, in both places they appear
// (the panel's fixed action bar and the matching accordion section).
//
// It exists so the header button and the section button can never disagree:
// same label, same disabled rule, same spinner, driven by the same context.
import { memo } from "react";
import { Loader2, UserMinus, UserPlus } from "lucide-react";

export type StaffActionVariant = "assign" | "cancel";

interface StaffActionButtonProps {
  variant: StaffActionVariant;
  label: string;
  /** Shown in place of `label` while the request is in flight. */
  submittingLabel: string;
  isSubmitting: boolean;
  /** False when the SOP stage forbids the action; the reason is shown by the caller. */
  isAllowed: boolean;
  onClick: () => void;
  className?: string;
}

const VARIANT_CLASS: Record<StaffActionVariant, string> = {
  assign:
    "bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
  cancel:
    "border border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10"
};

function StaffActionButtonBase({
  variant,
  label,
  submittingLabel,
  isSubmitting,
  isAllowed,
  onClick,
  className = ""
}: StaffActionButtonProps) {
  const Icon = variant === "assign" ? UserPlus : UserMinus;
  const isDisabled = isSubmitting || !isAllowed;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={isSubmitting}
      className={`flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
    >
      {isSubmitting ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate">{isSubmitting ? submittingLabel : label}</span>
    </button>
  );
}

export const StaffActionButton = memo(StaffActionButtonBase);
StaffActionButton.displayName = "StaffActionButton";

export default StaffActionButton;
