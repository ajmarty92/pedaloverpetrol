import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

export type JobStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

export interface Job {
  id: string;
  tracking_id: string;
  customer_id: string;
  driver_id: string | null;
  pickup_address: string;
  dropoff_address: string;
  status: JobStatus;
  price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useJobs(statusFilter?: JobStatus) {
  const qs = statusFilter ? `?status=${statusFilter}` : "";
  return useQuery<Job[]>({
    queryKey: ["jobs", statusFilter ?? "all"],
    queryFn: () => api.get<Job[]>(`/api/jobs${qs}`),
  });
}

export function useJob(jobId: string) {
  return useQuery<Job>({
    queryKey: ["job", jobId],
    queryFn: () => api.get<Job>(`/api/jobs/${jobId}`),
    enabled: !!jobId,
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation<Job, Error, { jobId: string; status: JobStatus }>({
    mutationFn: ({ jobId, status }) =>
      api.patch<Job>(`/api/jobs/${jobId}`, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["job", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
