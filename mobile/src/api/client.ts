import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const ACCESS_KEY = "pop_access_token";
const REFRESH_KEY = "pop_refresh_token";

export class ApiError extends Error {
  public code: string;

  constructor(
    public status: number,
    body: Record<string, unknown>,
  ) {
    const envelope = body?.error as Record<string, unknown> | undefined;
    const message =
      (typeof envelope?.message === "string" ? envelope.message : null) ??
      (typeof body?.detail === "string" ? body.detail : `API error ${status}`);
    super(message);
    this.name = "ApiError";
    this.code = typeof envelope?.code === "string" ? envelope.code : "error";
  }
}

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await AsyncStorage.getItem(ACCESS_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
    onUnauthorized?.();
    throw new ApiError(401, { error: { code: "unauthorized", message: "Session expired" } });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({
      error: { code: "error", message: res.statusText },
    }));
    const parsed = body && typeof body === "object" ? body : { detail: String(body) };
    const err = new ApiError(res.status, parsed);
    console.warn(`[API] ${options?.method ?? "GET"} ${path} → ${res.status}: ${err.message}`);
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
