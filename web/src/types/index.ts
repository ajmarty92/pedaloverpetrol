export type JobStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed";

export interface Job {
  id: string;
  tracking_id: string;
  customer_id: string;
  driver_id: string | null;
  pickup_address: string;
  dropoff_address: string;
  status: JobStatus;
  price: number | null;
  payment_status: PaymentStatus;
  notes: string | null;
  route_sequence: number | null;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  rule_name: string;
  base_rate: number;
  per_mile_rate: number;
  rush_surcharge: number;
  heavy_surcharge: number;
  zone_config: Record<string, unknown> | null;
  active: boolean;
  created_at: string;
}

export interface PriceQuoteResponse {
  rule_name: string;
  base_rate: number;
  distance_charge: number;
  rush_surcharge: number;
  heavy_surcharge: number;
  zone_multiplier: number;
  total: number;
  breakdown: string;
}

export interface PaymentIntentResponse {
  client_secret: string;
  amount: number;
  currency: string;
  mode: string;
}

export interface OptimizedJobItem {
  sequence: number;
  job_id: string;
  tracking_id: string;
  pickup_address: string;
  dropoff_address: string;
  status: JobStatus;
}

export interface OptimizeRouteResponse {
  driver_id: string;
  optimized_jobs: OptimizedJobItem[];
  total_distance_meters: number;
  total_duration_seconds: number;
  engine: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CustomerTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  customer_name: string;
}

export interface CustomerJob {
  id: string;
  tracking_id: string;
  pickup_address: string;
  dropoff_address: string;
  status: JobStatus;
  price: number | null;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  has_pod: boolean;
}

export interface PODInfo {
  id: string;
  job_id: string;
  recipient_name: string;
  signature_url: string | null;
  photo_urls: string[] | null;
  delivered_at: string;
  gps_lat: number | null;
  gps_lng: number | null;
}

export interface InvoiceInfo {
  job_id: string;
  tracking_id: string;
  customer_name: string;
  pickup_address: string;
  dropoff_address: string;
  status: string;
  price: number | null;
  created_at: string;
  delivered_at: string | null;
}

export interface TrackingDriverSummary {
  id: string;
  name: string;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update_at: string | null;
}

export interface AnalyticsSummary {
  jobs_total: number;
  jobs_delivered: number;
  jobs_failed: number;
  jobs_active: number;
  on_time_rate: number;
  avg_delivery_time_minutes: number | null;
}

export interface DayBucket {
  date: string;
  jobs_total: number;
  jobs_delivered: number;
  jobs_failed: number;
}

export interface ByDayResponse {
  range_days: number;
  buckets: DayBucket[];
}

export interface DriverPerformance {
  driver_id: string;
  driver_name: string;
  jobs_completed: number;
  jobs_failed: number;
  on_time_rate: number;
}

export interface ByDriverResponse {
  range_days: number;
  drivers: DriverPerformance[];
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
