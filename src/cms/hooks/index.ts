// src/cms/hooks/index.ts
/**
 * Custom Hooks Library
 */

// Redux Hooks
export { useAppDispatch, useAppSelector } from "@/core/hooks/redux";

// Authentication Hooks
export { useAuth } from "@/core/hooks/useAuth";
export { usePermissions } from "@/core/hooks/usePermissions";

// Data Hooks
export { useCustomerNotes } from "@/cms/hooks/useCustomerNotes";
export { useNoteCategories } from "@/cms/hooks/useNoteCategories";
// export { useTickets } from "@/core/hooks/useTickets";
// export { useWorkflows } from "@/core/hooks/useWorkflows";
// export { useNotifications } from "@/core/hooks/useNotifications";

// UI Hooks
export { useTheme } from "@/core/hooks/useTheme";
export { useModal } from "@/core/hooks/useModal";
export { useToast } from "@/core/hooks/useToast";
// export { useLocalStorage } from "@/core/hooks/useLocalStorage";
// export { useDebounce } from "@/core/hooks/useDebounce";
// export { useClickOutside } from "@/core/hooks/useClickOutside";

// Form Hooks
// export { useForm } from "@/core/hooks/useForm";
// export { useFormValidation } from "@/core/hooks/useFormValidation";

// Utility Hooks
// export { useAsyncEffect } from "@/core/hooks/useAsyncEffect";
// export { usePrevious } from "@/core/hooks/usePrevious";
// export { useInterval } from "@/core/hooks/useInterval";
// export { useWebSocket } from "@/core/hooks/useWebSocket";
// export { useGeolocation } from "@/core/hooks/useGeolocation";
