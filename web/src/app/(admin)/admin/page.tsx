"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { chartColors } from "@/lib/design-tokens";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AnalyticsSummary,
  ByDayResponse,
  ByDriverResponse,
} from "@/types";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Package;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {sub && <p className="text-xs text-gray-400">{sub}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-72 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function DashboardPage() {
  const [range, setRange] = useState("30d");

  const summary = useQuery<AnalyticsSummary>({
    queryKey: ["analytics", "summary", range],
    queryFn: () => api.get(`/api/analytics/summary?range=${range}`),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const byDay = useQuery<ByDayResponse>({
    queryKey: ["analytics", "by-day", range],
    queryFn: () => api.get(`/api/analytics/by-day?range=${range}`),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const byDriver = useQuery<ByDriverResponse>({
    queryKey: ["analytics", "by-driver", range],
    queryFn: () => api.get(`/api/analytics/by-driver?range=${range}`),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const s = summary.data;
  const isLoadingSummary = summary.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Analytics overview for PedalOverPetrol.">
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all ${
                range === opt.value
                  ? "bg-brand text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PageHeader>

      {summary.isError && <ErrorBanner message="Failed to load summary." />}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Jobs"
          value={s ? s.jobs_total.toLocaleString() : "—"}
          icon={Package}
          color="bg-brand/10 text-brand"
          loading={isLoadingSummary}
        />
        <StatCard
          label="Delivered"
          value={s ? s.jobs_delivered.toLocaleString() : "—"}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
          loading={isLoadingSummary}
        />
        <StatCard
          label="Failed"
          value={s ? s.jobs_failed.toLocaleString() : "—"}
          icon={XCircle}
          color="bg-red-50 text-red-600"
          loading={isLoadingSummary}
        />
        <StatCard
          label="On-Time Rate"
          value={s ? `${s.on_time_rate}%` : "—"}
          icon={TrendingUp}
          color="bg-blue-50 text-blue-600"
          loading={isLoadingSummary}
        />
        <StatCard
          label="Avg. Delivery"
          value={
            s && s.avg_delivery_time_minutes != null
              ? `${Math.round(s.avg_delivery_time_minutes)} min`
              : "—"
          }
          sub={s?.jobs_active ? `${s.jobs_active} active` : undefined}
          icon={Clock}
          color="bg-purple-50 text-purple-600"
          loading={isLoadingSummary}
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-700">
            Jobs per day
          </h2>
        </CardHeader>
        <CardContent>
          {byDay.isLoading && <ChartSkeleton />}
          {byDay.isError && <ErrorBanner message="Failed to load chart data." />}
          {byDay.data && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={byDay.data.buckets.map((b) => ({
                  ...b,
                  date: formatShortDate(b.date),
                }))}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: chartColors.tick }}
                  tickLine={false}
                  axisLine={{ stroke: chartColors.axis }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: chartColors.tick }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e5e5",
                    fontSize: 13,
                  }}
                />
                <Legend
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar
                  dataKey="jobs_delivered"
                  name="Delivered"
                  fill={chartColors.delivered}
                  radius={[3, 3, 0, 0]}
                  stackId="stack"
                />
                <Bar
                  dataKey="jobs_failed"
                  name="Failed"
                  fill={chartColors.failed}
                  radius={[3, 3, 0, 0]}
                  stackId="stack"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Driver table */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-700">
            Driver performance
          </h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header-cell">Driver</th>
                <th className="table-header-cell text-right">Completed</th>
                <th className="table-header-cell text-right">Failed</th>
                <th className="table-header-cell text-right">On-Time Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byDriver.isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-8" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-8" />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Skeleton className="ml-auto h-4 w-14" />
                    </td>
                  </tr>
                ))}

              {byDriver.isError && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <ErrorBanner message="Failed to load driver stats." />
                  </td>
                </tr>
              )}

              {byDriver.data?.drivers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No driver data for this period.
                  </td>
                </tr>
              )}

              {byDriver.data?.drivers.map((d) => (
                <tr
                  key={d.driver_id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {d.driver_name}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-gray-700">
                    {d.jobs_completed}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-gray-700">
                    {d.jobs_failed > 0 ? (
                      <span className="text-red-600">{d.jobs_failed}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        d.on_time_rate >= 90
                          ? "bg-green-50 text-green-700"
                          : d.on_time_rate >= 70
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {d.on_time_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
