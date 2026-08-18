// The full case record, opened from the staff panel on the map.
//
// Rendered by CaseDetailView rather than inside the map: the map container is
// `overflow-hidden`, which would clip a dialog, and the app has an existing
// dialog stack to respect.
//
// It reuses FormFieldValueDisplay - the same read-only view the page itself
// shows - deliberately WITHOUT `showMap`. This dialog is opened from a map, and
// mounting a second ArcGIS view inside it would be both wasteful and confusing.
// (That is also why PreviewDataBeforeSubmit is not reused here: it always passes
// `showMap`.)
import { Modal } from "@/core/components/ui/modal";
import { useTranslation } from "@/core/hooks/useTranslation";
import type { CaseDetails } from "@/cms/types/case";
import FormFieldValueDisplay from "../CaseDisplay";

interface CaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData?: CaseDetails;
}

export function CaseDetailsModal({ isOpen, onClose, caseData }: CaseDetailsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 w-full max-w-4xl p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
        {t("case.display.no")} # {caseData?.workOrderNummber || "-"}
      </h3>
      <div className="custom-scrollbar max-h-[70vh] overflow-y-auto pr-2">
        <FormFieldValueDisplay caseData={caseData} isCreate={false} />
      </div>
    </Modal>
  );
}

export default CaseDetailsModal;
