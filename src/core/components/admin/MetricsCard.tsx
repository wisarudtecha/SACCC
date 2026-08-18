// /src/components/admin/MetricsCard.tsx
import { PieChartIcon } from "@/core/icons";
import { CardSkeleton } from "@/core/components/ui/loading/LoadingSystem";

const MetricsCard: React.FC<{ 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  trend?: number;
  color?: string;
  className?:string
}> = ({ title, value, icon, trend, color = "blue" ,className}) => {
  if (!title && !value) {
    return (
      <div className="mb-6">
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 mb-6 cursor-default ` + className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-0">{title}</p>
          <div className="flex gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center">
                {trend > 0 ? (
                  <PieChartIcon className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <PieChartIcon className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend > 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
