import { cn } from "@/lib/utils";
import { AlertCircle, Clock, XCircle, CheckCircle } from "lucide-react";

export type BannerVariant = "pending" | "rejected" | "approved" | "error" | "info";

interface BannerProps {
  readonly variant: BannerVariant;
  readonly message: string;
  readonly onClose?: () => void;
  readonly children?: React.ReactNode;
  readonly className?: string;
}

const variantStyles = {
  pending: "bg-amber-50 border-amber-200 text-amber-800",
  rejected: "bg-red-50 border-red-200 text-red-800", 
  approved: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const variantIcons = {
  pending: Clock,
  rejected: XCircle,
  approved: CheckCircle,
  error: AlertCircle,
  info: AlertCircle,
};

export function Banner({ variant, message, onClose, children, className }: BannerProps) {
  const Icon = variantIcons[variant];
  
  return (
    <div 
      role="alert"
      className={cn(
        "flex items-start gap-3 p-4 border rounded-lg",
        variantStyles[variant],
        className
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{message}</p>
        {children && (
          <div className="mt-2 text-sm">
            {children}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-auto text-current hover:opacity-70 transition-opacity"
          aria-label="Close banner"
        >
          <XCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}