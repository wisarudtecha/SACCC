import { MoreVertical, Pencil, CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
interface ActionMenuProps {
    onEdit?: () => void;
    onApprove?: () => void;
    showEditButton?: boolean;
    showApproveButton?: boolean;
}

export default function ActionMenu({
    onEdit,
    onApprove,
    showEditButton = true,
    showApproveButton = true,
}: ActionMenuProps) {
     const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative inline-block" ref={menuRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="More actions"
            >
                <MoreVertical size={18} />
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {showEditButton && (
                        <button
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                            onClick={() => {
                                onEdit?.();
                                setOpen(false);
                            }}
                        >
                            <Pencil size={16} />
                            {t("knowledge.articles.edit")}
                        </button>

                    )}
                    {showApproveButton && (
                        <button
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:text-green-400 dark:hover:bg-gray-800"
                            onClick={() => {
                                onApprove?.();
                                setOpen(false);
                            }}
                        >
                            <CheckCircle size={16} />
                            {t("knowledge.articles.approve")}
                        </button>)}


                </div>
            )}
        </div>
    );
}