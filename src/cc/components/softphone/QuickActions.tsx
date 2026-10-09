// Quick-action buttons for the active-call left panel.
// Create Case navigates to the case-creation screen with pre-filled linkage.
// Add Call Note opens an inline composer wired to the customer-note API.
// Create Follow-up navigates to the calendar.
// Wrap-up Detail opens a post-call disposition modal.
import { useCallback, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import { useAppNavigate } from "@/core/router/useAppNavigate";
import { useCreateCustomerNoteMutation } from "@/cms/store/api/customerNote";
import { useToastContext } from "@/core/components/crud/ToastGlobal";
import { FileText, StickyNote, Bell, BarChart3, X } from "lucide-react";

export interface QuickActionsProps {
  callId: string;
  customerId?: string;
  caseId?: string;
  phoneNo?: string | null;
  controlsEnabled: boolean;
}

export function QuickActions({
  callId,
  customerId,
  phoneNo,
  controlsEnabled,
}: QuickActionsProps) {
  const { t } = useTranslation();
  const navigate = useAppNavigate("cms");
  const { addToast } = useToastContext();
  const [createNote] = useCreateCustomerNoteMutation();

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [wrapUpDisposition, setWrapUpDisposition] = useState("");

  const handleCreateCase = useCallback(() => {
    const params = new URLSearchParams();
    if (phoneNo && phoneNo.length > 0) {
      params.set("phoneNo", phoneNo);
    }
    if (customerId && customerId.length > 0) {
      params.set("customerId", customerId);
    }
    params.set("callId", callId);
    const query = params.toString();
    navigate(`/case/creation${query ? `?${query}` : ""}`);
  }, [navigate, phoneNo, customerId, callId]);

  const handleAddCallNote = useCallback(async () => {
    if (!customerId) {
      addToast("error", t("cc.softphone.note_no_customer"));
      return;
    }
    const body = noteBody.trim();
    if (!body) {
      addToast("error", t("cc.softphone.note_empty"));
      return;
    }
    setNoteSaving(true);
    try {
      await createNote({ customerId, note: body }).unwrap();
      addToast("success", t("cc.softphone.note_saved"));
      setNoteBody("");
      setNoteOpen(false);
    } catch {
      addToast("error", t("cc.softphone.note_save_failed"));
    } finally {
      setNoteSaving(false);
    }
  }, [customerId, noteBody, createNote, addToast, t]);

  const handleCreateFollowUp = useCallback(() => {
    navigate("/calendar");
  }, [navigate]);

  const handleWrapUp = useCallback(() => {
    setWrapUpOpen(true);
  }, []);

  const actions = [
    {
      key: "create_case",
      label: t("cc.softphone.create_case"),
      icon: (
        <FileText
          className="h-5 w-5 text-blue-600 dark:text-blue-400"
          aria-hidden="true"
        />
      ),
      onClick: handleCreateCase,
    },
    {
      key: "add_call_note",
      label: t("cc.softphone.add_call_note"),
      icon: (
        <StickyNote
          className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
      ),
      onClick: () => setNoteOpen(true),
    },
    {
      key: "create_follow_up",
      label: t("cc.softphone.create_follow_up"),
      icon: (
        <Bell
          className="h-5 w-5 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
      ),
      onClick: handleCreateFollowUp,
    },
    {
      key: "wrap_up_detail",
      label: t("cc.softphone.wrap_up_detail"),
      icon: (
        <BarChart3
          className="h-5 w-5 text-purple-600 dark:text-purple-400"
          aria-hidden="true"
        />
      ),
      onClick: handleWrapUp,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
        {t("cc.softphone.quick_actions")}
      </p>
      <div className="flex flex-col gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={!controlsEnabled}
            onClick={action.onClick}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Note composer modal */}
      {noteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setNoteOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-md flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("cc.softphone.add_call_note")}
              </p>
              <button
                type="button"
                onClick={() => setNoteOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder={t("cc.softphone.note_placeholder")}
              rows={4}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={noteSaving || !noteBody.trim()}
                onClick={handleAddCallNote}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {noteSaving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wrap-up disposition modal */}
      {wrapUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setWrapUpOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-full max-w-md flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("cc.softphone.wrap_up_detail")}
              </p>
              <button
                type="button"
                onClick={() => setWrapUpOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <textarea
              value={wrapUpDisposition}
              onChange={(e) => setWrapUpDisposition(e.target.value)}
              placeholder={t("cc.softphone.wrap_up_placeholder")}
              rows={4}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWrapUpOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  addToast(
                    "success",
                    t("cc.softphone.wrap_up_saved")
                  );
                  setWrapUpDisposition("");
                  setWrapUpOpen(false);
                }}
                className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-700"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
