import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { JobStatus, PaymentStatus } from "@/types";

const statusConfig: Record<JobStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-gray-100", text: "text-gray-700", label: "Pending" },
  assigned: { bg: "bg-brand-50", text: "text-brand-700", label: "Assigned" },
  picked_up: { bg: "bg-blue-50", text: "text-blue-700", label: "Picked Up" },
  in_transit: { bg: "bg-amber-50", text: "text-amber-700", label: "In Transit" },
  delivered: { bg: "bg-green-50", text: "text-green-700", label: "Delivered" },
  failed: { bg: "bg-red-50", text: "text-red-700", label: "Failed" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.bg,
        cfg.text,
      )}
    >
      {cfg.label}
    </span>
  );
}

const paymentConfig: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
  unpaid: { bg: "bg-gray-100", text: "text-gray-600", label: "Unpaid" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
  paid: { bg: "bg-green-50", text: "text-green-700", label: "Paid" },
  failed: { bg: "bg-red-50", text: "text-red-700", label: "Failed" },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const cfg = paymentConfig[status] ?? paymentConfig.unpaid;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", cfg.bg, cfg.text)}>
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
