import { cn } from "@/lib/utils";

const STEP_LABELS: Record<number, string> = {
  1: "Panch-tattva",
  2: "Maha-mantra",
};

interface StepIndicatorProps {
  currentStep: 1 | 2;
  completedSteps: Set<number>;
}

export function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex w-full items-center">
        {([1, 2] as const).map((step, index) => {
          const isCompleted = completedSteps.has(step);
          const isActive = step === currentStep;
          const isFuture = step > currentStep && !isCompleted;

          return (
            <li key={step} className="flex flex-1 items-center">
              {/* Left connector — all except first step */}
              {index > 0 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-all",
                    completedSteps.has(step - 1 as 1|2) ? "bg-primary" : "bg-border",
                  )}
                />
              )}

              <div className="flex flex-col items-center gap-1.5">
                <div
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                    isCompleted && "border-primary bg-primary text-white",
                    isActive && !isCompleted && "border-primary bg-primary-light text-primary-dark",
                    isFuture && "border-border bg-surface-alt text-muted",
                  )}
                >
                  {isCompleted ? (
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-center font-body text-xs sm:block",
                    isActive ? "font-semibold text-primary-dark" : "text-muted",
                  )}
                >
                  {STEP_LABELS[step]}
                </span>
              </div>

              {/* Right connector — all except last step */}
              {index < 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-all",
                    completedSteps.has(step) ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
