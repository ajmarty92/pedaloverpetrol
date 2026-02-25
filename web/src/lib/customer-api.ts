import { clearCustomerAuth, getCustomerAccessToken } from "./customer-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class CustomerApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown>,
  ) {
    super(typeof body?.detail === "string" ? body.detail : `API error ${status}`);
    this.name = "CustomerApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getCustomerAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearCustomerAuth();
    window.location.href = "/customer/login";
    throw new CustomerApiError(401, { detail: "Session expired" });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new CustomerApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const customerApi = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};
