"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
}

export function StepIndicator({
  currentStep,
  totalSteps,
  completedSteps,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = completedSteps.has(step);
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                isCompleted
                  ? "bg-saffron-600 text-white"
                  : isCurrent
                    ? "bg-saffron-100 border-2 border-saffron-600 text-saffron-700"
                    : "bg-gray-100 text-gray-400",
              ].join(" ")}
            >
              {isCompleted ? "✓" : step}
            </div>
            {step < totalSteps && (
              <div
                className={[
                  "h-0.5 w-8",
                  isCompleted ? "bg-saffron-600" : "bg-gray-200",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
