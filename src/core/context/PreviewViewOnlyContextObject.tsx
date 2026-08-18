// src/core/context/PreviewViewOnlyContextObject.tsx
import { createContext, useContext } from "react";

// PreviewDialog publishes its read-only state here so the arbitrary JSX supplied through
// PreviewConfig (tabs[].render, avatar, title, subtitle) can hide or disable its own controls.
export const PreviewViewOnlyContext = createContext<boolean>(false);

// Deliberately does NOT throw when used outside a provider, unlike useUserProfile. Components
// rendered inside preview tabs are shared with standalone pages — UserMetaCard/UserInfoCard/
// UserOrganizationCard render both in PreviewDialog and on /profile — so "not inside a preview"
// has to be a valid, non-restrictive answer rather than an error.
export const useIsPreviewViewOnly = (): boolean => useContext(PreviewViewOnlyContext);
