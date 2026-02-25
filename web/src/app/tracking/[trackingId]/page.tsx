"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Package, MapPin, Truck, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobStatus, TrackingInfo } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STEPS: { key: JobStatus; label: string }[] = [
  { key: "pending", label: "Order Placed" },
  { key: "assigned", label: "Driver Assigned" },
  { key: "picked_up", label: "Picked Up" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_DISPLAY: Record<JobStatus, { label: string; color: string; bg: string; icon: typeof Package }> = {
  pending: { label: "Pending", color: "text-gray-400", bg: "bg-gray-400/10", icon: Clock },
  assigned: { label: "Driver Assigned", color: "text-brand", bg: "bg-brand/10", icon: Truck },
  picked_up: { label: "Picked Up", color: "text-blue-500", bg: "bg-blue-500/10", icon: Package },
  in_transit: { label: "In Transit", color: "text-amber-500", bg: "bg-amber-500/10", icon: Truck },
  delivered: { label: "Delivered", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
};

function getStepIndex(status: JobStatus): number {
  if (status === "failed") return -1;
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StepIndicator({ currentStatus }: { currentStatus: JobStatus }) {
  const isFailed = currentStatus === "failed";
  const activeIdx = getStepIndex(currentStatus);

  return (
    <div className="relative flex items-center justify-between">
      {/* Connector line (behind dots) */}
      <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-700" />
      <div
        className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-brand transition-all duration-500"
        style={{
          width: isFailed ? "0%" : `${(activeIdx / (STEPS.length - 1)) * 100}%`,
        }}
      />

      {STEPS.map((step, i) => {
        const reached = !isFailed && i <= activeIdx;
        const isActive = !isFailed && i === activeIdx;
        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                reached
                  ? "border-brand bg-brand text-white"
                  : "border-gray-600 bg-gray-800 text-gray-500",
                isActive && "ring-4 ring-brand/20",
              )}
            >
              {reached ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">{i + 1}</span>
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold sm:text-xs",
                reached ? "text-white" : "text-gray-500",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-800" />
      <div className="h-40 animate-pulse rounded-2xl bg-gray-800" />
      <div className="h-24 animate-pulse rounded-2xl bg-gray-800" />
      <div className="h-24 animate-pulse rounded-2xl bg-gray-800" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-white">Tracking not found</h2>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

export default function TrackingPage() {
  const params = useParams<{ trackingId: string }>();
  const [info, setInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.trackingId) return;
    setLoading(true);
    setError("");

    fetch(`${API_BASE}/api/tracking/${params.trackingId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(typeof body.detail === "string" ? body.detail : `Error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setInfo(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.trackingId]);

  if (loading) return <Page><LoadingSkeleton /></Page>;
  if (error) return <Page><ErrorState message={error} /></Page>;
  if (!info) return null;

  const sd = STATUS_DISPLAY[info.status] ?? STATUS_DISPLAY.pending;
  const StatusIcon = sd.icon;

  return (
    <Page>
      <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2.5 rounded-full bg-gray-800 px-4 py-1.5">
            <Package className="h-4 w-4 text-brand" />
            <span className="text-sm font-bold text-white tracking-wide">
              {info.tracking_id}
            </span>
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", sd.bg)}>
              <StatusIcon className={cn("h-5 w-5", sd.color)} />
            </div>
            <span className={cn("text-lg font-bold", sd.color)}>{sd.label}</span>
          </div>
          <StepIndicator currentStatus={info.status} />
        </div>

        {/* Route card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
            Route
          </h3>
          <div className="flex gap-4">
            <div className="flex flex-col items-center pt-1">
              <div className="h-3 w-3 rounded-full bg-brand" />
              <div className="my-1 w-0.5 flex-1 bg-gray-700" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="flex flex-1 flex-col gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-500">Pickup</p>
                <p className="text-sm font-medium text-white">{info.pickup_address}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Drop-off</p>
                <p className="text-sm font-medium text-white">{info.dropoff_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
            Details
          </h3>
          <dl className="space-y-3 text-sm">
            <InfoRow label="Created" value={formatDateTime(info.created_at)} />
            <InfoRow label="Last updated" value={formatDateTime(info.updated_at)} />
            {info.delivered_at && (
              <InfoRow label="Delivered at" value={formatDateTime(info.delivered_at)} />
            )}
          </dl>
        </div>

        {/* Driver card */}
        {info.driver && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
              Driver
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10">
                <Truck className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-white">{info.driver.name}</p>
                {info.driver.current_lat != null && info.driver.current_lng != null ? (
                  <p className="text-xs text-gray-400">
                    Location: {info.driver.current_lat.toFixed(4)}, {info.driver.current_lng.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Location not yet available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map placeholder */}
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900/50">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-600" />
            <p className="text-sm font-medium text-gray-500">
              Live map coming soon
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600">
          Powered by PedalOverPetrol
        </p>
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-center border-b border-gray-800 bg-gray-950">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
            <Package className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">PedalOverPetrol</span>
        </div>
      </header>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-200">{value}</dd>
    </div>
  );
}
