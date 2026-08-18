import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { useTranslation } from '@/core/hooks/useTranslation';
import { getTimeDifference, isSlaViolated, ProgressStepPreviewProps } from '../sopStepTranForm';
import { CompactCountdownTimer } from '@/cms/components/countDownSla/countDownSla';
import { formatDate } from '@/core/utils/crud';
import { formatDuration } from '@/cms/components/Sla/formatSlaDuration';


const ProgressStepPreviewUnit: React.FC<ProgressStepPreviewProps> = ({ progressSteps ,sliceIndex=true }) => {
    const { t } = useTranslation();
    const filteredSteps = progressSteps.length === 6 && sliceIndex
        ? progressSteps.slice(1, -1)
        : progressSteps;
    const currentStepIndex = filteredSteps.findIndex(step => step.current);
    const currentStep = currentStepIndex >= 0 ? filteredSteps[currentStepIndex] : null;

    const calculateSlaPerformance = (step: any, previousStep: any) => {
        if (!step.sla || (!step.completed && !step.current) || !step.timeline?.completedAt || !previousStep?.timeline?.completedAt) {
            return null;
        }

        const startTime = new Date(previousStep.timeline.completedAt).getTime();
        const endTime = new Date(step.timeline.completedAt).getTime();
        const actualDurationMs = endTime - startTime;
        const actualDurationMinutes = actualDurationMs / (1000 * 60);
        const slaDurationMinutes = step.sla;
        const difference = actualDurationMinutes - slaDurationMinutes;
        const isOverdue = difference > 0;

        return {
            actualDuration: actualDurationMinutes,
            slaDuration: slaDurationMinutes,
            difference: Math.abs(difference),
            isOverdue
        };
    };

    return (
        <div className="mb-6 flex justify-center">
            <div className="w-full max-w-4xl">
                {filteredSteps.map((step, index) => {
                    const isLastStep = index === filteredSteps.length - 1;
                    const nextStep = !isLastStep ? filteredSteps[index + 1] : null;
                    const violated = isSlaViolated(step);
                    const previousStep = index > 0 ? filteredSteps[index - 1] : null;
                    const slaPerformance = calculateSlaPerformance(step, previousStep);
                    const shouldShowActiveLine =
                        (step.completed && nextStep?.completed) ||
                        (step.completed && nextStep?.current) ||
                        (step.current);
                        
                    return (
                        <div key={step.id} className=" space-x-5 flex items-start relative min-h-[100px]">
                            {/* Left side - SLA Information */}
                            <div className="w-30 flex flex-col items-end relative">

                                {!step.completed && step.current && !slaPerformance && (
                                    <div className="text-xs text-blue-500 dark:text-blue-400 text-right">
                                        {t("progress.in_progress")}
                                    </div>
                                )}

                                {!step.completed && !step.current && (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 text-right">
                                        {t("progress.pending")}
                                    </div>
                                )}

                                {/* SLA Performance - positioned at line height */}
                                {slaPerformance && (
                                    <div className="absolute bottom-[20px] right-6 text-xs text-right">
                                        {(step.sla || step.sla === 0) ? (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                                {t("progress.sla")}:{" "} {formatDuration(step.sla)}
                                            </div>
                                        ) :
                                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                                {t("progress.no_sla")}
                                            </div>}
                                        <div className="text-gray-500 dark:text-gray-400">
                                            {t("progress.actual")}:{" "} {formatDuration(slaPerformance.actualDuration)}
                                        </div>
                                        <div className={`font-medium ${slaPerformance.isOverdue ? 'text-red-500' : 'text-green-500'}`}>
                                            {slaPerformance.isOverdue
                                                ? `${t("progress.overdue_by")} ${formatDuration(slaPerformance.difference)}`
                                                : `${t("progress.faster_by")} ${formatDuration(slaPerformance.difference)}`
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Center - Circle and Line */}
                            <div className="flex flex-col items-center relative">
                                {/* Circle */}
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-800 relative z-10 flex-shrink-0
                                    ${step.completed
                                        ? violated
                                            ? 'border-red-500 text-red-500'
                                            : 'border-blue-500 text-blue-500'
                                        : step.current
                                            ? violated ? 'border-red-500 text-red-500'
                                                : 'border-blue-500 text-blue-500'
                                            : 'border-gray-300 dark:border-gray-600 text-gray-400'
                                    }
                                `}>
                                    {step.completed ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <Circle className={`w-3 h-3 ${step.current ? 'fill-current' : ''}`} />
                                    )}
                                </div>

                                {/* Connecting Line */}
                                {!isLastStep && (
                                    <div className="relative w-0.5 h-20 flex items-center justify-center">
                                        <div className={`
                                            w-full h-full
                                            ${step.current ? 'bg-gray-300 dark:bg-gray-600' :
                                                shouldShowActiveLine ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                                        `} />

                                        {/* Time Difference Badge */}
                                        {index < filteredSteps.length - 1 && filteredSteps[index + 1]?.timeline?.completedAt && !filteredSteps[index + 1]?.nextStage && (
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                                                {(() => {
                                                    const nextStepViolated = isSlaViolated(filteredSteps[index + 1]);
                                                    const timeDiff = getTimeDifference(step, filteredSteps[index + 1]);
                                                    return timeDiff && (
                                                        <div className={`
                                                            ${!nextStepViolated
                                                                ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                                                                : "bg-red-100 dark:bg-red-900 border-red-500 text-red-500 dark:text-red-300"
                                                            } px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-sm
                                                        `}>
                                                            {timeDiff}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {/* Countdown Timer for Next Step */}
                                        {index < filteredSteps.length - 1 &&
                                            filteredSteps[index + 1]?.nextStage &&
                                            currentStep?.timeline?.completedAt &&
                                            filteredSteps[index + 1]?.sla ?
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                                                <CompactCountdownTimer
                                                    createdAt={currentStep?.timeline?.completedAt}
                                                    sla={filteredSteps[index + 1].sla}
                                                    size="sm"
                                                    className="px-2 py-1 rounded-md text-xs font-medium shadow-sm"
                                                />
                                            </div>
                                            : null
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Right side - Step Information */}
                            <div className="flex-1 pt-1">
                                <div className={`
                                    text-sm font-medium mb-1 leading-tight
                                    ${step.completed
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : step.current
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                    }
                                `}>
                                    {step.title}
                                </div>

                                {step.timeline?.completedAt && (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                                        {formatDate(
                                            new Date(new Date(step.timeline.completedAt).getTime()).toISOString()
                                        )}
                                    </div>
                                )}

                                {step.description && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                                        {step.description}
                                    </div>
                                )}

                                {/* Due time for next step */}
                                {step.nextStage && currentStep?.timeline?.completedAt && step.sla && step.sla != 0 ? (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-1">
                                        {t("case.sop_card.due")}: {formatDate(
                                            new Date(new Date(currentStep.timeline.completedAt).getTime() + (step.sla * 60 * 1000)).toISOString()
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgressStepPreviewUnit;