"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  AlertCircle,
  FileText,
  Eye,
  X,
  MapPin,
  Pen,
  Camera,
  Download,
  CreditCard,
  Check,
  Loader2,
} from "lucide-react";
import { customerApi, CustomerApiError } from "@/lib/customer-api";
import { formatDate, truncate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerJob, JobStatus, PaymentStatus, PODInfo, InvoiceInfo, PaymentIntentResponse } from "@/types";

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
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

function PODModal({
  jobId,
  trackingId,
  onClose,
}: {
  jobId: string;
  trackingId: string;
  onClose: () => void;
}) {
  const {
    data: pod,
    isLoading,
    isError,
  } = useQuery<PODInfo>({
    queryKey: ["customer-pod", jobId],
    queryFn: () => customerApi.get(`/api/customer/jobs/${jobId}/pod`),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold text-gray-900">
              Proof of Delivery
            </h2>
            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
              {trackingId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-60" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-gray-500">Failed to load POD data.</p>
            </div>
          )}

          {pod && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Received by</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Pen className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{pod.recipient_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Delivered at</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDateTime(pod.delivered_at)}
                  </p>
                </div>
              </div>

              {pod.signature_url && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Signature</p>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <img
                      src={pod.signature_url}
                      alt="Signature"
                      className="mx-auto h-24 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <p className="mt-2 text-center text-xs text-gray-400 break-all">
                      {pod.signature_url}
                    </p>
                  </div>
                </div>
              )}

              {pod.photo_urls && pod.photo_urls.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-400">
                    <Camera className="h-3.5 w-3.5" /> Photos ({pod.photo_urls.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {pod.photo_urls.map((url, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500 break-all"
                      >
                        {url}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pod.gps_lat != null && pod.gps_lng != null && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  GPS: {pod.gps_lat.toFixed(5)}, {pod.gps_lng.toFixed(5)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({
  jobId,
  trackingId,
  onClose,
}: {
  jobId: string;
  trackingId: string;
  onClose: () => void;
}) {
  const {
    data: inv,
    isLoading,
    isError,
  } = useQuery<InvoiceInfo>({
    queryKey: ["customer-invoice", jobId],
    queryFn: () => customerApi.get(`/api/customer/jobs/${jobId}/invoice`),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold text-gray-900">Invoice</h2>
            <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
              {trackingId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-32" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-gray-500">Failed to load invoice.</p>
            </div>
          )}

          {inv && (
            <div className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400">Invoice for</p>
                    <p className="text-lg font-bold text-gray-900">{inv.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase text-gray-400">Tracking</p>
                    <p className="font-mono text-sm font-bold text-gray-700">{inv.tracking_id}</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pickup</span>
                    <span className="text-gray-900">{inv.pickup_address}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Drop-off</span>
                    <span className="text-gray-900">{inv.dropoff_address}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium capitalize text-gray-900">{inv.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-900">{formatDateTime(inv.created_at)}</span>
                  </div>
                  {inv.delivered_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivered</span>
                      <span className="text-gray-900">{formatDateTime(inv.delivered_at)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-base font-semibold text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {inv.price != null ? `$${inv.price.toFixed(2)}` : "—"}
                  </span>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400">
                Full PDF invoices coming soon.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function PayButton({ jobId, onPaid }: { jobId: string; onPaid: () => void }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function handlePay() {
    setLoading(true);
    setErr("");
    try {
      const res = await customerApi.post<PaymentIntentResponse>(
        `/api/customer/jobs/${jobId}/create-payment-intent`,
      );
      if (res.mode === "stub") {
        setDone(true);
        onPaid();
      } else {
        setDone(true);
        onPaid();
      }
    } catch (e) {
      setErr(e instanceof CustomerApiError ? e.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
        <Check className="h-3.5 w-3.5" /> Paid
      </span>
    );
  }

  return (
    <div>
      <Button variant="default" size="sm" onClick={handlePay} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
        Pay Now
      </Button>
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
    </div>
  );
}

export default function CustomerJobsPage() {
  const queryClient = useQueryClient();
  const [podModal, setPodModal] = useState<{ jobId: string; trackingId: string } | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<{ jobId: string; trackingId: string } | null>(null);

  const {
    data: jobs,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CustomerJob[]>({
    queryKey: ["customer-jobs"],
    queryFn: () => customerApi.get("/api/customer/jobs"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Deliveries</h1>
        <p className="text-sm text-gray-500">
          Track your jobs, view proofs of delivery, and pay online.
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Tracking ID</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Pickup</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Drop-off</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Payment</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr>
                  <td colSpan={7}><TableSkeleton /></td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-4 py-16">
                      <AlertCircle className="h-10 w-10 text-red-400" />
                      <p className="font-medium text-gray-900">Failed to load your jobs</p>
                      <p className="text-sm text-gray-500">
                        {error instanceof Error ? error.message : "Unknown error"}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Try again
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && jobs?.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16">
                      <Package className="h-10 w-10 text-gray-300" />
                      <p className="font-medium text-gray-900">No deliveries yet</p>
                      <p className="text-sm text-gray-500">
                        Your delivery history will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {jobs?.map((job) => (
                <tr
                  key={job.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-900">
                    {job.tracking_id}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {truncate(job.pickup_address, 28)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {truncate(job.dropoff_address, 28)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-4">
                    {job.payment_status === "unpaid" && job.price != null ? (
                      <PayButton
                        jobId={job.id}
                        onPaid={() => queryClient.invalidateQueries({ queryKey: ["customer-jobs"] })}
                      />
                    ) : (
                      <PaymentBadge status={job.payment_status} />
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {job.delivered_at
                      ? formatDateTime(job.delivered_at)
                      : formatDate(job.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {job.has_pod && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPodModal({ jobId: job.id, trackingId: job.tracking_id })
                          }
                        >
                          <Eye className="h-3.5 w-3.5" />
                          POD
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setInvoiceModal({ jobId: job.id, trackingId: job.tracking_id })
                        }
                      >
                        <Download className="h-3.5 w-3.5" />
                        Invoice
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {podModal && (
        <PODModal
          jobId={podModal.jobId}
          trackingId={podModal.trackingId}
          onClose={() => setPodModal(null)}
        />
      )}

      {invoiceModal && (
        <InvoiceModal
          jobId={invoiceModal.jobId}
          trackingId={invoiceModal.trackingId}
          onClose={() => setInvoiceModal(null)}
        />
      )}
    </div>
  );
}
