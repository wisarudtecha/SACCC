// components/progress/ProgressBar.tsx
import React from "react";
import { useTranslation } from "@/core/hooks/useTranslation";
import {
    isSlaViolated,
    ProgressStepPreviewProps,
} from "../sopStepTranForm";
import { CompactCountdownTimer } from "@/cms/components/countDownSla/countDownSla";
import { formatDate } from "@/core/utils/crud";
import { StepCircle, TimeBadge } from "@/cms/components/Sla/Sla";

const formatAdjustedDate = (date: string | Date) =>
    formatDate(
        new Date(new Date(date).getTime()).toISOString()
    );


const formatDueDate = (date: string | Date, sla: number) =>
    formatDate(
        new Date(
            new Date(date).getTime() + sla * 60 * 1000
        ).toISOString()
    );

const ProgressStepPreview: React.FC<ProgressStepPreviewProps> = ({
    progressSteps,
}) => {
    const { t } = useTranslation();
    const currentStepIndex = progressSteps.findIndex((s) => s.current);
    const currentStep =
        currentStepIndex >= 0 ? progressSteps[currentStepIndex] : null;
    
    return (
        <div className="mb-4 sm:mb-6 w-full">
            {/* Mobile Layout */}
            <div className="block sm:hidden space-y-3">
                {progressSteps.map((step, index) => {
                    const isLastStep = index === progressSteps.length - 1;
                    const violated = isSlaViolated(step);
                    const previousStep = index > 0 ? progressSteps[index - 1] : null;

                    return (
                        <div
                            key={step.id}
                            className="flex items-start space-x-3 relative"
                        >
                            {!isLastStep && (
                                <div className="absolute left-4 top-8 w-0.5 h-13 bg-gray-300 dark:bg-gray-600 z-0" />
                            )}

                            <StepCircle
                                completed={step.completed}
                                current={step.current as boolean}
                                violated={violated}
                                step={step}
                                previousStep={previousStep}
                            />

                            <div className="flex-1 min-w-0 pt-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                    <div
                                        className={`text-sm font-medium mb-1 ${step.completed || step.current
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 dark:text-gray-400"
                                            }`}
                                    >
                                        {step.title}
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                        {step.timeline?.completedAt && (
                                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                                {formatAdjustedDate(step.timeline.completedAt)}
                                            </div>
                                        )}

                                        {index > 0 &&
                                            progressSteps[index - 1] &&
                                            step.timeline?.completedAt && (
                                                <TimeBadge
                                                    from={progressSteps[index - 1]}
                                                    to={step}
                                                    violated={violated}
                                                />
                                            )}

                                        {step.nextStage &&
                                            currentStep?.timeline?.completedAt &&
                                            step.sla ? (
                                            <>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                                                    {t("case.sop_card.due")}:{" "} {formatDueDate(currentStep.timeline.completedAt, step.sla)}
                                                </div>
                                                <CompactCountdownTimer
                                                    createdAt={currentStep.timeline.completedAt}
                                                    sla={step.sla}
                                                    size="sm"
                                                    className="px-2 py-1 rounded-md text-xs font-medium self-start"
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Layout */}
            <div
                className="hidden sm:flex items-start justify-between relative"
                style={{ minHeight: "120px" }}
            >
                {progressSteps.map((step, index) => {
                    const isLastStep = index === progressSteps.length - 1;
                    const nextStep = !isLastStep ? progressSteps[index + 1] : null;
                    const violated = isSlaViolated(step);
                    const previousStep = index > 0 ? progressSteps[index - 1] : null;

                    const activeLine =
                        (step.completed && nextStep?.completed) ||
                        (step.completed && nextStep?.current) ||
                        step.current;

                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center relative flex-1"
                        >
                            {/* Line */}
                            <div
                                className="absolute top-4 left-0 w-full h-0.5 z-0 flex"
                                style={{ transform: "translateY(-1px)" }}
                            >
                                {step.current ? (
                                    <>
                                        <div
                                            className={`w-1/2 h-full ${activeLine
                                                ? "bg-blue-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                                }`}
                                        />
                                        <div className="w-1/2 h-full bg-gray-300 dark:bg-gray-600" />
                                    </>
                                ) : (
                                    <div
                                        className={`w-full h-full ${activeLine
                                            ? "bg-blue-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                            }`}
                                    />
                                )}
                            </div>

                            <StepCircle
                                completed={step.completed}
                                current={step.current as boolean}
                                violated={violated}
                                step={step}
                                previousStep={previousStep}
                            />

                            {index > 0 &&
                                progressSteps[index - 1] &&
                                step.timeline?.completedAt &&
                                !step.nextStage && (
                                    <div className="absolute top-1 left-0 transform -translate-x-1/2 z-20">
                                        <TimeBadge
                                            from={progressSteps[index - 1]}
                                            to={step}
                                            violated={violated}
                                        />
                                    </div>
                                )}

                            {step.nextStage &&
                                currentStep?.timeline?.completedAt &&
                                (
                                    <div className="absolute top-1 left-0 transform -translate-x-1/2 z-20">
                                        <CompactCountdownTimer
                                            createdAt={currentStep.timeline.completedAt}
                                            sla={step.sla}
                                            size="sm"
                                        />
                                    </div>
                                )}

                            <div className="text-center px-1 md:px-2 mt-6">
                                <div
                                    className={`text-xs md:text-sm font-medium mb-1 leading-tight ${step.completed || step.current
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400"
                                        }`}
                                >
                                    {step.title}
                                </div>

                                {step.timeline?.completedAt && (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                                        {formatAdjustedDate(step.timeline.completedAt)}
                                    </div>
                                )}

                                {step.nextStage &&
                                    currentStep?.timeline?.completedAt &&
                                    step.sla ? (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                                        {t("case.sop_card.due")}:{" "}
                                        {formatDueDate(currentStep.timeline.completedAt, step.sla)}
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

export default ProgressStepPreview;