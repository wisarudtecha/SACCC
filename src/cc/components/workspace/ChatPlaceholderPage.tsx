// Placeholder body for Live Chat surfaces (CC-CHAT). The routes and sidebar
// entries exist for entitlement gating; the actual chat functionality ships
// in a later phase. Rendered only for tenants entitled to "entitlement.chat" —
// unentitled tenants are stopped by the route gate before reaching this.
import { MessageSquare } from "lucide-react";
import { useTranslation } from "@/core/hooks/useTranslation";

interface ChatPlaceholderPageProps {
  /** i18n key for the page heading. */
  titleKey: string;
}

export function ChatPlaceholderPage({ titleKey }: ChatPlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
        {t(titleKey)}
      </h1>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.02]">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
          <MessageSquare className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
          {t("cc.chat.coming_soon_title")}
        </h2>
        <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
          {t("cc.chat.coming_soon_body")}
        </p>
      </div>
    </div>
  );
}
