"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, AlertCircle, Route } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDate, truncate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizeRouteModal } from "@/components/optimize-route-modal";
import type { Job, JobStatus } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

interface DriverSummary {
  id: string;
  name: string;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <div className="text-center">
        <p className="font-medium text-gray-900">Failed to load jobs</p>
        <p className="mt-1 text-sm text-gray-500">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <Package className="h-6 w-6 text-gray-400" />
      </div>
      <p className="font-medium text-gray-900">No jobs found</p>
      <p className="text-sm text-gray-500">Try adjusting your filters.</p>
    </div>
  );
}

export default function JobsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [optimizeDriverId, setOptimizeDriverId] = useState<string | null>(null);
  const [driverInput, setDriverInput] = useState("");

  const queryString = statusFilter ? `?status=${statusFilter}` : "";

  const {
    data: jobs,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Job[]>({
    queryKey: ["jobs", statusFilter],
    queryFn: () => api.get<Job[]>(`/api/jobs${queryString}`),
  });

  const { data: drivers } = useQuery<DriverSummary[]>({
    queryKey: ["drivers"],
    queryFn: () => api.get<DriverSummary[]>("/api/drivers"),
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500">Manage and track delivery jobs.</p>
        </div>
      </div>

      {/* Filters + optimize */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {statusFilter && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter("")}>
            Clear filter
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <select
            value={driverInput}
            onChange={(e) => setDriverInput(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            <option value="">Select driver…</option>
            {drivers?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="default"
            disabled={!driverInput}
            onClick={() => setOptimizeDriverId(driverInput)}
          >
            <Route className="h-4 w-4" />
            Optimize Route
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Tracking ID</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Pickup</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Drop-off</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Driver</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Seq</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={8}>
                    <TableSkeleton />
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={8}>
                    <ErrorState
                      message={error instanceof Error ? error.message : "Unknown error"}
                      onRetry={() => refetch()}
                    />
                  </td>
                </tr>
              )}

              {!isLoading && !isError && jobs?.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState />
                  </td>
                </tr>
              )}

              {jobs?.map((job) => (
                <tr
                  key={job.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                    {job.tracking_id}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {job.customer_id.slice(0, 8)}…
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {truncate(job.pickup_address, 30)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {truncate(job.dropoff_address, 30)}
                  </td>
                  <td className="px-6 py-4">
                    {job.driver_id ? (
                      <span className="text-gray-700">
                        {job.driver_id.slice(0, 8)}…
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {job.route_sequence != null ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {job.route_sequence}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatDate(job.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Optimize Route Modal */}
      {optimizeDriverId && (
        <OptimizeRouteModal
          driverId={optimizeDriverId}
          onClose={() => setOptimizeDriverId(null)}
          onApplied={() => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
          }}
        />
      )}
    </div>
  );
}
