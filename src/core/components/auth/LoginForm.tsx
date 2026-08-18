// src/core/components/auth/LoginForm.tsx
import React, { useState } from "react";
import { AlertIcon, CloseIcon, EnvelopeIcon, EyeCloseIcon, EyeIcon } from "@/core/icons";
import { ThemeToggleButton } from "@/core/components/common/ThemeToggleButton";
import { isSSOAvailable } from "@/core/config/api";
import { useAuth } from "@/core/hooks/useAuth";
import { useTranslation } from "@/core/hooks/useTranslation";
import { Autocomplete } from "@/core/components/form/form-elements/Autocomplete";
import type { LoginCredentials } from "@/core/types/auth";
import changelog from "@/changelog.json";
import { DevLoginBypassButton } from "@/core/components/auth/DevLoginBypassButton";
import ResetPasswordModal from "@/core/components/auth/ForgotPassword";
import LangDropdown from "@/core/components/header/LangDropdown";
import Checkbox from "@/core/components/form/input/Checkbox";
import Input from "@/core/components/form/input/InputField";
import Label from "@/core/components/form/Label";
import Button from "@/core/components/ui/button/Button";

declare const __APP_VERSION__: string;

export const LoginForm: React.FC = () => {
  const { state, login, forgotPassword, clearError } = useAuth();
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
    organization: "BMA",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isPasswordResetSent, setIsPasswordResetSent] = useState(false);

  const versionInfo = Object.entries(changelog).map(([version, info]) => ({ version, ...info }));

  const ssoToken = isSSOAvailable();

  // console.log("🔐 LoginForm rendered - Network:", state.networkStatus, "Loading:", state.isLoading);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!credentials.username) {
      errors.username = t("auth.signin.username.required");
    }
    
    if (!credentials.password) {
      errors.password = t("auth.signin.password.required");
    }
    else if (credentials.password.length < 6) {
      errors.password = t("auth.signin.password.min");
    }

    if (!credentials.organization) {
      errors.organization = t("auth.signin.organization.required");
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    if (state.networkStatus === "offline") {
      setValidationErrors({ network: t("auth.signin.state.network_status") });
      return;
    }
    
    clearError();
    await login(credentials);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      setValidationErrors({ forgotEmail: t("auth.signin.email.required") });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setValidationErrors({ forgotEmail: t("auth.signin.email.invalid") });
      return;
    }

    try {
      await forgotPassword(forgotEmail);
      setIsPasswordResetSent(true);
      setValidationErrors({});
    }
    catch (error) {
      setValidationErrors({ 
        forgotEmail: error instanceof Error ? error.message : t("auth.signin.email.error") 
      });
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string | boolean) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleShowPassword = () => {
    if (!state.isLoading && (!state.isLocked || ssoToken)) {
      setShowPassword(!showPassword);
    }
  }

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        <div className="absolute flex items-center top-6 right-6 gap-3">
          <LangDropdown />
          <ThemeToggleButton className="bg-white dark:hover:text-gray-300" />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div>
              <div className="mb-5 sm:mb-8 place-items-center">
                {/* <img className="dark:hidden" src="/images/logo/logo.png" alt="Logo" /> */}
                {/* <img className="hidden dark:block" src="/images/logo/logo-dark.png" alt="Logo" /> */}
                <img className="w-50 bg-gray-900 p-2 rounded-lg" src="/images/logo/logo.svg" alt="Logo" />
              </div>

              <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md cursor-default">
                  {showForgotPassword ? t("auth.signin.forgot_password.title") : t("auth.signin.title")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 cursor-default">
                  {showForgotPassword ? t("auth.signin.forgot_password.subtitle") : t("auth.signin.subtitle")}
                </p>
              </div>

              {/* Network Status */}
              {state.networkStatus !== "online" && (
                <div className="mb-4 p-3 rounded-lg flex items-center text-sm bg-red-50 border border-red-200 text-red-700">
                  <CloseIcon className="w-4 h-4 mr-2" />
                  <span>{t("auth.signin.state.network_offline")}</span>
                </div>
              )}
              {/*
              <div className={`mb-4 p-3 rounded-lg flex items-center text-sm ${
                state.networkStatus === "online" 
                  ? "bg-green-50 border border-green-200 text-green-700" 
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {state.networkStatus === "online" ? (
                  <CheckLineIcon className="w-4 h-4 mr-2" />
                ) : (
                  <CloseIcon className="w-4 h-4 mr-2" />
                )}
                <span>
                  {state.networkStatus === "online"
                    ? t("auth.signin.state.network_online")
                    : t("auth.signin.state.network_offline")
                  }
                </span>
              </div>
              */}

              {/* Account lockout warning */}
              {state.isLocked && !ssoToken && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg cursor-default">
                  <div className="flex items-center">
                    <AlertIcon className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700 text-sm">
                      {t("auth.signin.state.is_locked")}
                    </span>
                  </div>
                </div>
              )}

              {/*
                Local-only escape hatch, shown with the lockout above.
                `import.meta.env.DEV` is inlined as `false` by `vite build`, so this
                branch never exists in a deployed bundle. Do not swap this for an
                API_CONFIG.ENV check - .env.qa resolves to "local".
              */}
              {import.meta.env.DEV && state.isLocked && !ssoToken && (
                <DevLoginBypassButton />
              )}

              {/* Error message */}
              {state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg cursor-default">
                  <div className="flex items-center">
                    <AlertIcon className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700 text-sm">{state.error}</span>
                  </div>
                </div>
              )}

              {/* Network error */}
              {validationErrors.network && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg cursor-default">
                  <div className="flex items-center">
                    <CloseIcon className="w-5 h-5 text-orange-500 mr-2" />
                    <span className="text-orange-700 text-sm">{validationErrors.network}</span>
                  </div>
                </div>
              )}

              <div>
                {showForgotPassword ? (
                  // Forgot Password Form
                  <div className="space-y-6">
                    {isPasswordResetSent ? (
                      <div className="text-center">
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-700 text-sm cursor-default">
                            Password reset instructions have been sent to your email address.
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setIsPasswordResetSent(false);
                            setForgotEmail("");
                          }}
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </Label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              type="email"
                              id="forgot-email"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                                validationErrors.forgotEmail ? "border-red-300 bg-red-50" : "border-gray-300"
                              }`}
                              placeholder="Enter your email"
                            />
                          </div>
                          {validationErrors.forgotEmail && (
                            <div className="relative flex justify-center text-sm text-red-600 dark:text-red-300">
                              {validationErrors.forgotEmail}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            onClick={handleForgotPassword}
                            variant="primary"
                          >
                            Send Reset Email
                          </Button>
                          <Button
                            onClick={() => setShowForgotPassword(false)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Username field */}
                    <div>
                      <Label htmlFor="username">
                        {t("auth.signin.username.label")} <span className="text-error-500 dark:text-error-400">*</span>{" "}
                      </Label>
                      <Input
                        id="username"
                        value={credentials.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder={t("auth.signin.username.placeholder")}
                        disabled={state.isLoading || (state.isLocked && !ssoToken) || state.networkStatus === "offline"}
                        required
                      />
                    </div>
                    {validationErrors.username && (
                      <div className="relative flex justify-center text-sm text-red-600 dark:text-red-300">
                        {validationErrors.username}
                      </div>
                    )}

                    {/* Password field */}
                    <div>
                      <Label htmlFor="password">
                        {t("auth.signin.password.label")} <span className="text-error-500 dark:text-error-400">*</span>{" "}
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={credentials.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                          placeholder={t("auth.signin.password.placeholder")}
                          disabled={state.isLoading || (state.isLocked && !ssoToken) || state.networkStatus === "offline"}
                          required
                        />
                        <span
                          onClick={() => handleShowPassword()}
                          className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                        >
                          {showPassword ? (
                            <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                          ) : (
                            <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                          )}
                        </span>
                      </div>
                    </div>
                    {validationErrors.password && (
                      <div className="relative flex justify-center text-sm text-red-600 dark:text-red-300">
                        {validationErrors.password}
                      </div>
                    )}

                    {/* Organization field */}
                    <div>
                      <Label htmlFor="organization">
                        {t("auth.signin.organization.label")} <span className="text-error-500 dark:text-error-400">*</span>{" "}
                      </Label>
                      <Autocomplete
                        id="organization"
                        // value={credentials.organization || "SKY-AI"}
                        value={credentials.organization}
                        onSelect={(value) => handleInputChange("organization", value)}
                        placeholder={t("auth.signin.organization.placeholder")}
                        disabled={state.isLoading || (state.isLocked && !ssoToken) || state.networkStatus === "offline"}
                        required
                        suggestions={["BMA", "SKY-AI"]}
                      />
                    </div>
                    {validationErrors.organization && (
                      <div className="relative flex justify-center text-sm text-red-600 dark:text-red-300">
                        {validationErrors.organization}
                      </div>
                    )}

                    {/* Remember me */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          // id="remember-me"
                          checked={credentials.rememberMe}
                          onChange={(checked) => handleInputChange("rememberMe", checked)}
                          disabled={state.isLoading || (state.isLocked && !ssoToken) || state.networkStatus === "offline"}
                        />
                        <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-200 cursor-default">
                          {t("auth.signin.keep_logged_in")}
                        </span>
                      </div>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowResetModal(true);
                        }}
                        className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-500"
                      >
                        {t("auth.signin.reset_password")}
                      </a>
                    </div>

                    {/* Submit button */}
                    <div>
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={state.isLoading || (state.isLocked && !ssoToken) || state.networkStatus === "offline"}
                      >
                        {state.isLoading ? t("auth.signin.loading") : t("auth.signin.button")}
                      </Button>
                    </div>

                    {/*
                    {!API_CONFIG.DEMO_MODE && (
                      <div className="bg-yellow-100 dark:bg-yellow-800 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 cursor-default">
                        <p className="text-xs text-yellow-700 dark:text-yellow-200 mb-2">API Mode Active:</p>
                        <div className="text-xs text-yellow-600 dark:text-yellow-300">
                          <p>• Backend: {API_CONFIG.BASE_URL}</p>
                          <p>• Use your real account credentials</p>
                          <p>• Ensure backend server is running</p>
                          <p>• CORS must be configured properly</p>
                        </div>
                      </div>
                    )}
                    */}

                    {/* Demo credentials */}
                    {/*
                    <div className="bg-blue-100 dark:bg-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg p-3 cursor-default">
                      <p className="text-xs text-blue-700 dark:text-blue-200 mb-2">{t("auth.signin.demo.title")}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-300">{t("auth.signin.demo.username")}: wisarud.tec</p>
                          <p className="text-xs text-blue-600 dark:text-blue-300">{t("auth.signin.demo.password")}: string</p>
                          <p className="text-xs text-blue-600 dark:text-blue-300">{t("auth.signin.demo.organization")}: SKY-AI</p>
                        </div>
                        <Button
                          onClick={() => {
                            setCredentials({
                              username: "wisarud.tec",
                              password: "string",
                              organization: "SKY-AI",
                              rememberMe: true
                            });
                            setValidationErrors({});
                          }}
                          disabled={state.isLoading || state.isLocked || state.networkStatus === "offline"}
                          variant="info"
                          size="xs"
                        >
                          {t("auth.signin.demo.auto_fill")}
                        </Button>
                      </div>
                    </div>
                    */}
                  </div>
                )}

                <div className="flex justify-between mt-5">
                  <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start cursor-default">
                    {t("auth.signin.no_account")} {""}
                    <a
                      // href="/signup"
                      href="/"
                      className="text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-500"
                    >
                      {t("auth.signin.sign_up")}
                    </a>
                  </p>

                  <div className="font-light text-gray-500 dark:text-gray-400 text-sm">
                    <span className="cursor-default">v{versionInfo[0]?.version || __APP_VERSION__}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSuccess={() => {
          setShowResetModal(false);
          // อาจจะแสดง toast notification หรือทำอย่างอื่น
        }}
      />
    </div>
  );
};
