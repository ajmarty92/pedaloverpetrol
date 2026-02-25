"use client";

import { useState } from "react";
import { Route, X, Check, Clock, Ruler, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { cn, truncate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import type { OptimizeRouteResponse } from "@/types";

interface Props {
  driverId: string;
  onClose: () => void;
  onApplied: () => void;
}

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function OptimizeRouteModal({ driverId, onClose, onApplied }: Props) {
  const [result, setResult] = useState<OptimizeRouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"idle" | "optimized" | "done">("idle");

  async function handleOptimize() {
    setLoading(true);
    setError("");
    try {
      const data = await api.post<OptimizeRouteResponse>(
        `/api/drivers/${driverId}/optimize-route`,
        {},
      );
      setResult(data);
      setPhase("optimized");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!result) return;
    setApplying(true);
    setError("");
    try {
      await api.post(`/api/drivers/${driverId}/apply-route`, {
        sequence: result.optimized_jobs.map((j) => ({
          job_id: j.job_id,
          sequence: j.sequence,
        })),
      });
      setPhase("done");
      onApplied();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to apply route");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold text-gray-900">Optimize Route</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {phase === "idle" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
                <Route className="h-7 w-7 text-brand" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Calculate optimal stop order
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Uses today's active jobs for this driver to suggest the most
                  efficient delivery sequence.
                </p>
              </div>
            </div>
          )}

          {phase === "optimized" && result && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <Ruler className="h-3.5 w-3.5" />
                    Total distance
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {formatDistance(result.total_distance_meters)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    Est. travel time
                  </div>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {formatDuration(result.total_duration_seconds)}
                  </p>
                </div>
              </div>

              {/* Job list */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Suggested order
                </p>
                {result.optimized_jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {job.sequence}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900 font-mono">
                          {job.tracking_id}
                        </span>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {truncate(job.pickup_address, 35)} → {truncate(job.dropoff_address, 35)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-gray-400">
                Engine: {result.engine}
              </p>
            </div>
          )}

          {phase === "done" && (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Route applied</p>
                <p className="mt-1 text-sm text-gray-500">
                  The job sequence has been saved. The driver will see the
                  updated order.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {phase === "idle" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleOptimize} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Optimizing…
                  </>
                ) : (
                  <>
                    <Route className="h-4 w-4" />
                    Run Optimization
                  </>
                )}
              </Button>
            </>
          )}

          {phase === "optimized" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Discard
              </Button>
              <Button onClick={handleApply} disabled={applying}>
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Apply Route
                  </>
                )}
              </Button>
            </>
          )}

          {phase === "done" && (
            <Button onClick={onClose}>Close</Button>
          )}
        </div>
      </div>
    </div>
  );
}
