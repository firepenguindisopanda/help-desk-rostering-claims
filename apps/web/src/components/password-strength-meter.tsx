"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

const PASSWORD_CRITERIA = [
  {
    key: "length" as const,
    test: (value: string) => value.length >= 8,
    label: "At least 8 characters",
  },
  {
    key: "uppercase" as const,
    test: (value: string) => /[A-Z]/.test(value),
    label: "Contains an uppercase letter",
  },
  {
    key: "number" as const,
    test: (value: string) => /\d/.test(value),
    label: "Contains a number",
  },
  {
    key: "special" as const,
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
    label: "Contains a special character",
  },
];

type PasswordStrengthMeterProps = {
  readonly password: string;
  readonly className?: string;
};

const strengthLabels = [
  { threshold: 0, label: "Very weak", tone: "text-red-600" },
  { threshold: 25, label: "Weak", tone: "text-orange-500" },
  { threshold: 50, label: "Fair", tone: "text-yellow-500" },
  { threshold: 75, label: "Strong", tone: "text-emerald-600" },
  { threshold: 100, label: "Excellent", tone: "text-emerald-700" },
];

function PasswordStrengthMeterComponent({ password, className }: PasswordStrengthMeterProps) {
  const { percent, label, labelTone, criteria, barBackground, barIndicator } = useMemo(() => {
    const metCriteria = PASSWORD_CRITERIA.map((criterion) => ({
      ...criterion,
      met: criterion.test(password),
    }));
    const metCount = metCriteria.filter((criterion) => criterion.met).length;
    const percent = Math.round((metCount / PASSWORD_CRITERIA.length) * 100);
    const strength = [...strengthLabels].reverse().find(({ threshold }) => percent >= threshold);
    let barBackground = "bg-red-100";
    let barIndicator = "bg-red-500";
    if (percent >= 75) {
      barBackground = "bg-emerald-100";
      barIndicator = "bg-emerald-500";
    } else if (percent >= 50) {
      barBackground = "bg-yellow-100";
      barIndicator = "bg-yellow-500";
    }

    return {
      percent,
      label: strength?.label ?? "Very weak",
      labelTone: strength?.tone ?? "text-red-600",
      criteria: metCriteria,
      barBackground,
      barIndicator,
    };
  }, [password]);

  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password strength</span>
        <span className={cn("font-medium", labelTone)}>{label}</span>
      </div>
      <div className={cn("h-2 w-full overflow-hidden rounded-full", barBackground)}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", barIndicator)}
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />
      </div>
      <ul className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
        {criteria.map((criterion) => (
          <li key={criterion.key} className={cn("flex items-center gap-2", criterion.met ? "text-emerald-600" : "")}
            aria-live="polite">
            {criterion.met ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Circle className="h-4 w-4 text-gray-300" aria-hidden="true" />
            )}
            <span>{criterion.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const PasswordStrengthMeter = memo(PasswordStrengthMeterComponent);
