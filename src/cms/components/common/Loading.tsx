
import { useTranslation } from "@/core/hooks/useTranslation";
import { SpinnerIcon } from "@/core/icons/SpinnerIcon";


export const LoadingModal = () => {
    const { t } = useTranslation();
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100000">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <div className="text-center">
              <div className="text-lg text-gray-700 dark:text-gray-200 font-semibold">{t("common.loading")}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

interface LoadingProps {
  className?: string;
}

const Loading = ({ className = "" }: LoadingProps) => {
  const { t } = useTranslation();

  return (
    <div 
      className={`flex justify-center text-gray-500 items-center ${className}`}
    >
      <SpinnerIcon className="w-8 h-8 text-gray-600 dark:text-gray-300 animate-spin mb-2" />
      <span className="text-sm font-medium">
        {t("common.loading")}
      </span>
    </div>
  );
};

export default Loading;
