import { useMemo } from "react"
import { Clock } from "lucide-react"
import { ProgressSteps } from "../sopStepTranForm"

import { useTranslation } from "@/core/hooks/useTranslation";
import { formatDuration } from "@/cms/components/Sla/formatSlaDuration";

interface ProgressSummaryProps {
    progressSteps: ProgressSteps[]
    sliceIndex?: boolean
}

export default function ProgressSummary({ progressSteps, sliceIndex = true }: ProgressSummaryProps) {
    // Calculate summary statistics
    const filteredSteps = progressSteps.length !== 2 && sliceIndex
        ? progressSteps.slice(1, -1)
        : progressSteps;
    // const filteredSteps = progressSteps.slice(1, -1)
    //     ? progressSteps.slice(1, -1)
    //     : progressSteps;
    const { t } = useTranslation();
    const summary = useMemo(() => {
        const total = filteredSteps.length
        const completed = filteredSteps.reduce((sum, step, index) =>
            index != 0 ? step.completed || step.current ? sum + (step.sla || 0) : sum : 0, 0);
        const current = filteredSteps.find(step => step.current)
        const totalSLA = filteredSteps.reduce((acc, step, index) =>
            index != 0 ? acc + (step.sla || 0) : acc, 0);
        let totalDuration = 0;
        filteredSteps.forEach(step => {
            if (step.timeline?.duration) {
                totalDuration += step.timeline.duration * 1000;
            } else if (step.current && step.nextStage && step.timeline?.completedAt) {
                const startTime = new Date(step.timeline.completedAt).getTime();
                totalDuration += Date.now() + startTime;
            } else if (step.nextStage && !step.completed) {
                const prevStep = filteredSteps.find(s => s.current);
                if (prevStep?.timeline?.completedAt) {
                    const startTime = new Date(prevStep.timeline.completedAt).getTime();
                    totalDuration += Date.now() - startTime;
                }
            }
        });
        const totalDurationMinutes = totalDuration / 60000;
        const slaUsagePercent = totalSLA > 0 ? Math.min((totalDurationMinutes / totalSLA) * 100, 100) : 0;

        return {
            total,
            inProgress: current ? 1 : 0,
            pending: total - completed - (current ? 1 : 0),
            currentStep: current,
            totalSLA,
            totalDuration,
            totalDurationMinutes,
            slaUsagePercent,
            completionRate: completed && totalSLA > 0 ? Math.round((completed / totalSLA) * 100) : 0
        }
    }, [filteredSteps])

    // const formatDuration = (ms: number) => {
    //     if (!ms) return "0m"
    //     const minutes = Math.floor(ms / 60000)
    //     const hours = Math.floor(minutes / 60)
    //     const days = Math.floor(hours / 24)

    //     if (days > 0) {
    //         return `${days}d ${hours % 24}h`
    //     }
    //     if (hours > 0) {
    //         return `${hours}h ${minutes % 60}m`
    //     }
    //     return `${minutes}m`
    // }

    // Determine color based on SLA usage
    const getSLAColor = (percentage: number) => {
        if (percentage < 50) return "from-green-500 to-green-600"
        if (percentage < 80) return "from-yellow-500 to-yellow-600"
        return "from-red-500 to-red-600"
    }

    return (
        <div className="">
            {/* <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                Progress Summary
            </h4> */}

            {/* Completion Rate Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("progress.completed_progress")}</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{summary.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${summary.completionRate}%` }}
                    />
                </div>
            </div>

            {/* Total SLA Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("progress.total_sla")}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDuration(summary.totalSLA)}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                        className={`bg-gradient-to-r ${getSLAColor(summary.slaUsagePercent)} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(summary.slaUsagePercent, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {/* {formatDuration(Math.floor(summary.totalDuration / 60000))} */}
                    </span>
                    <span className={`text-xs font-medium ${summary.slaUsagePercent > 100 ? 'text-red-600 dark:text-red-400' :
                        summary.slaUsagePercent > 80 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-green-600 dark:text-green-400'
                        }`}>
                        {/* {t("progress.used")} {Math.round(summary.slaUsagePercent)}% */}
                        {t("progress.used")} {formatDuration(Math.floor(summary.totalDuration / 60000))}
                    </span>
                </div>
            </div>

            {/* Duration Progress Bar */}
            {/* <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Time Progress</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDuration(summary.totalDuration)}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(summary.slaUsagePercent, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Started {formatDuration(summary.totalDuration)} ago
                    </span>
                    {summary.slaUsagePercent > 100 && (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Over SLA
                        </span>
                    )}
                </div>
            </div> */}
        </div>
    )
}