// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/core/components/auth/ProtectedRoute";
import { SessionTimeoutWarning } from "@/core/components/auth/SessionTimeoutWarning";
import { AppWrapper } from "@/core/components/common/PageMeta.tsx";
import { TranslationLoader } from "@/core/components/common/TranslationLoader";
import { ToastProvider } from "@/core/components/crud/ToastGlobal";
import { WebSocketProvider } from "@/core/components/websocket/websocket";
import { LanguageProvider } from "@/core/context/LanguageContext";
import { ThemeProvider } from "@/core/context/ThemeContext";
import { AuthProvider } from "@/core/providers/AuthProvider";
import { store } from "@/core/store";
import App from "@/App.tsx";
import LoadingScreen from "@/core/components/common/LoadingScreen";
import "@/index.css";
import "@/globals.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <LanguageProvider>
          <TranslationLoader fallback={<LoadingScreen />}>
          <ToastProvider>
            <AuthProvider>
              <BrowserRouter>
                <SessionTimeoutWarning />
                <ProtectedRoute>
                  <AppWrapper>
                    <WebSocketProvider autoConnect={true}>
                      <App />
                    </WebSocketProvider>
                  </AppWrapper>
                </ProtectedRoute>
              </BrowserRouter>
            </AuthProvider>
            </ToastProvider>
          </TranslationLoader>
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
