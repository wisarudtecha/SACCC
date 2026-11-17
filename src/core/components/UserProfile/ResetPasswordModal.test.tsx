// src/core/components/UserProfile/ResetPasswordModal.test.tsx
//
// The reset dialog no longer asks the admin to type the target's email and username — it reads
// them off the account record it was opened from. POST /users/reset_password
// (User.ResetPassword) still identifies the account by email + username, so these tests pin
// both halves of that requirement:
//
//   1. the only inputs are the new password and its confirmation;
//   2. the payload is unchanged: { email, username, newPassword };
//   3. an account record that carries no email/username cannot submit at all, instead of
//      posting a blank identity (the GraphQL input cleaner drops empty strings, so a blank
//      value would reach the BFF as a MISSING field and come back as an opaque rejection).
//
// useResetPasswordMutation / usePermissions / useIsSystemAdmin / useTranslation are mocked; the
// dialog itself, its validation and the payload it builds are the real code.
//
// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordModal from "@/core/components/UserProfile/ResetPasswordModal";

const resetPasswordMock = vi.hoisted(() => vi.fn());
const permissionState = vi.hoisted(() => ({ canReset: true }));

vi.mock("@/core/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key, language: "en" })
}));

vi.mock("@/core/hooks/usePermissions", () => ({
  usePermissions: () => ({
    hasPermission: () => permissionState.canReset
  })
}));

vi.mock("@/core/hooks/useIsSystemAdmin", () => ({
  useIsSystemAdmin: () => false
}));

vi.mock("@/core/store/api/userApi", () => ({
  useResetPasswordMutation: () => [resetPasswordMock, { isLoading: false }]
}));

// React 19 only writes into a jsdom container inside `act` when this is set.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TARGET_EMAIL = "somchai@skyict.co.th";
const TARGET_USERNAME = "somchai";
const TARGET_DISPLAY_NAME = "Somchai Jaidee";
const NEW_PASSWORD = "Password1!";

let container: HTMLDivElement;
let root: Root;

interface MountedProps {
  email?: string;
  username?: string;
}

const mount = async (props: MountedProps = {}) => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      <ResetPasswordModal
        isOpen
        onClose={() => {}}
        email={TARGET_EMAIL}
        username={TARGET_USERNAME}
        displayName={TARGET_DISPLAY_NAME}
        {...props}
      />
    );
  });
};

/** The dialog portals into document.body, so queries go there rather than into `container`. */
const bodyText = () => document.body.textContent ?? "";
const inputs = () => Array.from(document.body.querySelectorAll("input"));
const buttonWithText = (label: string) =>
  Array.from(document.body.querySelectorAll("button")).find(button => button.textContent?.includes(label));

/** Drive a controlled React input the way a real keystroke does. */
const typeInto = (input: HTMLInputElement, value: string) => {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setValue?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

beforeEach(() => {
  permissionState.canReset = true;
  resetPasswordMock.mockReset();
});

afterEach(async () => {
  await act(async () => {
    root?.unmount();
  });
  container?.remove();
  document.body.innerHTML = "";
});

describe("ResetPasswordModal", () => {
  it("asks only for the new password and its confirmation", async () => {
    await mount();

    expect(inputs().map(input => input.id)).toEqual(["newPassword", "confirmPassword"]);
    expect(inputs().every(input => input.type === "password")).toBe(true);
  });

  it("shows which account is being reset, as read-only text", async () => {
    await mount();

    const text = bodyText();
    expect(text).toContain(TARGET_DISPLAY_NAME);
    expect(text).toContain(TARGET_USERNAME);
    expect(text).toContain(TARGET_EMAIL);

    // No leftover identity input in any form: not type=email, not the old field ids.
    expect(inputs().some(input => input.type === "email")).toBe(false);
    expect(inputs().some(input => input.id === "email" || input.id === "username")).toBe(false);
  });

  it("still sends email + username + newPassword to the API", async () => {
    resetPasswordMock.mockReturnValue({
      unwrap: () => Promise.resolve({ status: true })
    });

    await mount();

    const [newPassword, confirmPassword] = inputs();
    await act(async () => {
      typeInto(newPassword, NEW_PASSWORD);
      typeInto(confirmPassword, NEW_PASSWORD);
    });

    await act(async () => {
      buttonWithText("userform.resetPassword")?.click();
    });

    expect(resetPasswordMock).toHaveBeenCalledTimes(1);
    expect(resetPasswordMock).toHaveBeenCalledWith({
      email: TARGET_EMAIL,
      username: TARGET_USERNAME,
      newPassword: NEW_PASSWORD
    });
  });

  it("blocks the submit when the account record carries no email", async () => {
    await mount({ email: "" });

    expect(bodyText()).toContain("userform.resetPasswordTargetMissing");
    expect(buttonWithText("userform.resetPassword")?.disabled).toBe(true);

    await act(async () => {
      buttonWithText("userform.resetPassword")?.click();
    });
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("blocks the submit when the account record carries no username", async () => {
    await mount({ username: "" });

    expect(buttonWithText("userform.resetPassword")?.disabled).toBe(true);
  });

  it("refuses to call the API without the reset permission, even with a complete target", async () => {
    permissionState.canReset = false;

    await mount();

    const [newPassword, confirmPassword] = inputs();
    await act(async () => {
      typeInto(newPassword, NEW_PASSWORD);
      typeInto(confirmPassword, NEW_PASSWORD);
    });

    await act(async () => {
      buttonWithText("userform.resetPassword")?.click();
    });

    expect(resetPasswordMock).not.toHaveBeenCalled();
    expect(bodyText()).toContain("userform.unauthorized");
  });
});
