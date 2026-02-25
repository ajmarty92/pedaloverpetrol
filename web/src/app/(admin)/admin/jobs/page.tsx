"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, AlertCircle, Route } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDate, truncate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PaymentBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { OptimizeRouteModal } from "@/components/optimize-route-modal";
import type { Driver, Job, JobStatus } from "@/types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "picked_up", label: "Picked Up" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

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

function JobsEmptyState() {
  return (
    <EmptyState
      icon={<Package className="h-6 w-6" />}
      title="No jobs found"
      subtitle="Try adjusting your filters."
    />
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

  const { data: drivers } = useQuery<Driver[]>({
    queryKey: ["drivers"],
    queryFn: () => api.get<Driver[]>("/api/drivers"),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" subtitle="Manage and track delivery jobs." />

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
              <tr className="border-b border-gray-100">
                <th className="table-header-cell">Tracking ID</th>
                <th className="table-header-cell">Customer</th>
                <th className="table-header-cell">Pickup</th>
                <th className="table-header-cell">Drop-off</th>
                <th className="table-header-cell">Driver</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Payment</th>
                <th className="table-header-cell text-center">Seq</th>
                <th className="table-header-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={9}>
                    <TableSkeleton />
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={9}>
                    <ErrorState
                      message={error instanceof Error ? error.message : "Unknown error"}
                      onRetry={() => refetch()}
                    />
                  </td>
                </tr>
              )}

              {!isLoading && !isError && jobs?.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <JobsEmptyState />
                  </td>
                </tr>
              )}

              {jobs?.map((job) => (
                <tr key={job.id} className="table-row-hover">
                  <td className="table-cell font-mono text-xs font-semibold text-gray-900">
                    {job.tracking_id}
                  </td>
                  <td className="table-cell text-gray-600">
                    {job.customer_id.slice(0, 8)}…
                  </td>
                  <td className="table-cell text-gray-600">
                    {truncate(job.pickup_address, 30)}
                  </td>
                  <td className="table-cell text-gray-600">
                    {truncate(job.dropoff_address, 30)}
                  </td>
                  <td className="table-cell">
                    {job.driver_id ? (
                      <span className="text-gray-700">{job.driver_id.slice(0, 8)}…</span>
                    ) : (
                      <span className="italic text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="table-cell">
                    <PaymentBadge status={job.payment_status} />
                  </td>
                  <td className="table-cell text-center">
                    {job.route_sequence != null ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-800 tabular">
                        {job.route_sequence}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="table-cell tabular text-gray-500">
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
