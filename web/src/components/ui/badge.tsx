import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { JobStatus, PaymentStatus } from "@/types";

const statusConfig: Record<JobStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending:    { bg: "bg-gray-100",   text: "text-gray-700",   dot: "bg-gray-400",   label: "Pending" },
  assigned:   { bg: "bg-brand-50",   text: "text-brand-800",  dot: "bg-brand",      label: "Assigned" },
  picked_up:  { bg: "bg-blue-50",    text: "text-blue-800",   dot: "bg-blue-500",   label: "Picked Up" },
  in_transit: { bg: "bg-amber-50",   text: "text-amber-800",  dot: "bg-amber-500",  label: "In Transit" },
  delivered:  { bg: "bg-green-50",   text: "text-green-800",  dot: "bg-green-500",  label: "Delivered" },
  failed:     { bg: "bg-red-50",     text: "text-red-800",    dot: "bg-red-500",    label: "Failed" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} aria-hidden />
      {cfg.label}
    </span>
  );
}

const paymentConfig: Record<PaymentStatus, { bg: string; text: string; dot: string; label: string }> = {
  unpaid:  { bg: "bg-gray-100",  text: "text-gray-600",  dot: "bg-gray-400",  label: "Unpaid" },
  pending: { bg: "bg-amber-50",  text: "text-amber-800", dot: "bg-amber-500", label: "Pending" },
  paid:    { bg: "bg-green-50",  text: "text-green-800", dot: "bg-green-500", label: "Paid" },
  failed:  { bg: "bg-red-50",    text: "text-red-800",   dot: "bg-red-500",   label: "Failed" },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = paymentConfig[status] ?? paymentConfig.unpaid;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} aria-hidden />
      {cfg.label}
    </span>
  );
}

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        "bg-gray-100 text-gray-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
