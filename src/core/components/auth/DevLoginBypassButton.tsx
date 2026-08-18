// src/core/components/auth/DevLoginBypassButton.tsx
import Button from "@/core/components/ui/button/Button";
import { seedDevBypassSession } from "@/core/utils/devLoginBypass";

/**
 * Rendered only from a branch guarded by `import.meta.env.DEV`, so this never
 * reaches a deployed bundle. See seedDevBypassSession() for what it fabricates.
 */
export function DevLoginBypassButton() {
  return (
    <div className="mb-6 p-4 border border-dashed border-red-400 rounded-lg dark:border-red-500">
      <p className="mb-3 text-xs text-red-600 dark:text-red-300 cursor-default">
        DEV LOGIN BYPASS &mdash; local development only. Creates an unsigned mock session, so API
        and websocket calls will fail with 401.
      </p>

      <Button
        className="w-full"
        size="xs"
        variant="outline-error"
        onClick={seedDevBypassSession}
      >
        Skip login (dev bypass)
      </Button>
    </div>
  );
}
