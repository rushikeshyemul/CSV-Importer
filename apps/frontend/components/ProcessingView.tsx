"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProcessingStep {
  label: string;
  done: boolean;
  active: boolean;
}

interface ProcessingViewProps {
  message: string;
  progress: number; // 0–100
  steps: ProcessingStep[];
}

export function ProcessingView({ message, progress, steps }: ProcessingViewProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-12 px-8 max-w-md mx-auto">
      {/* Animated spinner */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary/10 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="w-full text-center space-y-3">
        <p className="text-base font-medium text-foreground animate-pulse">
          {message}
        </p>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
      </div>

      <div className="w-full space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all",
              step.done && "text-muted-foreground",
              step.active && "bg-primary/5 text-primary font-medium",
              !step.done && !step.active && "text-muted-foreground/50"
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0",
                step.done && "bg-green-500/20 text-green-500",
                step.active && "bg-primary/20 text-primary",
                !step.done && !step.active && "bg-muted text-muted-foreground"
              )}
            >
              {step.done ? "✓" : step.active ? "●" : "○"}
            </span>
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}
