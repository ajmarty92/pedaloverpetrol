import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900",
          "placeholder:text-gray-400",
          "transition-shadow",
          "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:border-brand",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500" : "border-gray-300",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  ),
);

Input.displayName = "Input";
