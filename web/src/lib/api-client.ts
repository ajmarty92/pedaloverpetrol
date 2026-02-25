import { clearAuth, getAccessToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  public code: string;

  constructor(
    public status: number,
    body: Record<string, unknown>,
  ) {
    const envelope = body?.error as Record<string, unknown> | undefined;
    const message = (typeof envelope?.message === "string" ? envelope.message : null)
      ?? (typeof body?.detail === "string" ? body.detail : `API error ${status}`);
    super(message);
    this.name = "ApiError";
    this.code = typeof envelope?.code === "string" ? envelope.code : "error";
  }
}

function parseErrorBody(body: unknown): Record<string, unknown> {
  if (body && typeof body === "object") return body as Record<string, unknown>;
  return { detail: String(body) };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new ApiError(401, { error: { code: "unauthorized", message: "Session expired" } });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { code: "error", message: res.statusText } }));
    const err = new ApiError(res.status, parseErrorBody(body));
    console.error(`[API] ${options?.method ?? "GET"} ${path} → ${res.status}: ${err.message}`);
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
};
