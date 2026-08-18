"use client";

// No longer need useState for fullyHidden
import Button from "@/core/components/ui/button/Button";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
} from "lucide-react";
import { formConfigurations, formTypeIcons } from "./constant";
import { useTranslation } from "@/core/hooks/useTranslation";

interface AddFormSelectorProps {
    isOpen: boolean;
    addField: (formType: string, parentId?: string) => void;
    hide: boolean;
    setHide: (hide: boolean) => void;
}

export const AddFormSelector: React.FC<AddFormSelectorProps> = ({
    isOpen,
    addField,
    hide,
    setHide,
}) => {

    if (!isOpen) return null;
    const { t } = useTranslation()
    return (
        <div
            className={`
        left-0 top-[10px] z-30 py-4 px-2
        bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm
        rounded-2xl sticky overflow-y-auto custom-scrollbar
        md:top-[10px] md:my-3.5 md:px-4 md:py-3 h-fit
        ${hide ? "w-fit md:w-fit my-3.5" : "w-full md:w-auto"}
      `}
        >
            <div
                className={`
          flex items-center justify-between
          ${hide ? "flex-col md:flex-row" : "flex-col md:flex-row"}
        `}
            >
                {/* ===== Toggle Buttons ===== */}
                <div className={`flex justify-center md:hidden ${!hide && "mb-3"}`}>
                    {/* Mobile (Up/Down) */}
                    {hide ? (
                        <ChevronRightIcon
                            className="w-7 h-7 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={() => {
                                setHide(false);
                            }}
                        />
                    ) : (
                        <ChevronLeftIcon
                            className="w-7 h-7 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={() => setHide(true)}
                        />
                    )}
                </div>

                <div className={`hidden md:flex items-center ${!hide && "mr-3"}`}>
                    {/* Desktop (Left/Right) */}
                    {hide ? (
                        <ChevronRightIcon
                            className="w-7 h-7 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={() => {
                                setHide(false);
                            }}
                        />
                    ) : (
                        <ChevronLeftIcon
                            className="w-7 h-7 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                            onClick={() => setHide(true)}
                        />
                    )}
                </div>

                {/* ===== Content (No longer animated) ===== */}
                {/* Render content directly based on `hide` state */}
                {!hide && (
                    <div
                        className={`
              flex flex-col space-y-2 w-full
              md:grid md:grid-cols-5 md:sm:grid-cols-4 md:md:grid-cols-7 md:lg:grid-cols-10 md:xl:grid-cols-14 md:gap-2
            `}
                    >
                        <div className="flex justify-center items-center">
                            <h1 className="text-gray-700 dark:text-white text-center">
                                {t("formElement.form_elements")}
                            </h1>
                        </div>


                        {formConfigurations.map((item) => (
                            <div
                                key={item.formType}
                                className={`
                  h-full
                `}
                            >
                                <Button
                                    className="w-full h-full text-center bg-gray-200/50 dark:bg-gray-700/50 rounded-lg p-2 text-[10px] sm:text-sm dark:text-gray-300 text-gray-800 hover:text-sky-700 dark:hover:text-sky-400"
                                    onClick={() => addField(item.formType)}
                                    variant="outline-no-transparent"
                                    size="xxs"
                                    endIcon={formTypeIcons[item.formType]}
                                    endIconClass="hidden md:block"
                                >
                                    <span>{t(item.title)}</span>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddFormSelector;