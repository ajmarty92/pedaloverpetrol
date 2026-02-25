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

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TrackingDriverSummary {
  id: string;
  name: string;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update_at: string | null;
}

export interface TrackingInfo {
  tracking_id: string;
  status: JobStatus;
  pickup_address: string;
  dropoff_address: string;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  driver: TrackingDriverSummary | null;
}
