// /src/components/auth/SessionTimeoutWarning.tsx
import { useCallback, useEffect, useState } from "react";
import { AlertIcon } from "@/core/icons";
import { useAuth } from "@/core/hooks/useAuth";
import { useTranslation } from "@/core/hooks/useTranslation";
import Button from "@/core/components/ui/button/Button";

const remainingSeconds = (deadline: number | null): number => {
  if (deadline === null) {
    return 0;
  }
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
};

/**
 * Counts down to the token deadline. Extendable: refreshing produces a later deadline,
 * and REFRESH_SUCCESS clears `sessionTimeout`, which unmounts this modal.
 *
 * The absolute session cap (SESSION_TIMEOUT_TIMER) does not surface here — reaching it
 * signs the user out directly and silently, with no warning (see useHardSessionCap).
 *
 * Expiry itself is owned by useSessionExpiry; this component only displays the
 * countdown, so the two cannot race to sign the user out.
 */
export const SessionTimeoutWarning = () => {
  const { state, logout, refreshToken } = useAuth();
  const { t } = useTranslation();

  const deadline = state.sessionTimeout;

  const [secondsLeft, setSecondsLeft] = useState(() => remainingSeconds(deadline));
  const [isExtending, setIsExtending] = useState(false);
  const [hasExtendFailed, setHasExtendFailed] = useState(false);

  useEffect(() => {
    setHasExtendFailed(false);
  }, [deadline]);

  useEffect(() => {
    if (deadline === null) {
      return;
    }

    // Seeded up front so the modal never shows a stale count for its first second.
    setSecondsLeft(remainingSeconds(deadline));

    const interval = setInterval(() => {
      setSecondsLeft(remainingSeconds(deadline));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const handleExtend = useCallback(async () => {
    setIsExtending(true);
    setHasExtendFailed(false);

    try {
      await refreshToken();
    }
    finally {
      setIsExtending(false);
    }

    // A successful refresh clears sessionTimeout, so this modal would already be gone.
    // Still being here means the refresh did not renew the session.
    setHasExtendFailed(true);
  }, [refreshToken]);

  if (deadline === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-400/50 bg-opacity-50 flex items-center justify-center z-999999 backdrop-blur-[32px]">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <AlertIcon className="h-12 w-12 text-orange-500 dark:text-orange-400 mx-auto mb-4" />

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("auth.signin.state.session_timeout.title")}
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t("auth.signin.state.session_timeout.subtitle")} {secondsLeft}{" "}
            {t("auth.signin.state.session_timeout.description")}
          </p>

          {hasExtendFailed && (
            <p className="text-error-600 dark:text-error-400 text-sm mb-4">
              {t("auth.signin.state.session_timeout.extend_failed")}
            </p>
          )}

          <div className="flex space-x-3 justify-center">
            <Button
              onClick={handleExtend}
              disabled={isExtending}
            >
              {isExtending
                ? t("auth.signin.state.session_timeout.extending")
                : t("auth.signin.state.session_timeout.login")}
            </Button>

            <Button
              onClick={logout}
              variant="error"
            >
              {t("auth.signin.state.session_timeout.logout")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
