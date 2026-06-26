const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3004";

export class ApiError extends Error {
  constructor(message: string, public readonly code?: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

let authToken: string | null = localStorage.getItem("tteona_token");

export function saveAuth(token: string) {
  authToken = token;
  localStorage.setItem("tteona_token", token);
}

export function clearAuth() {
  authToken = null;
  localStorage.removeItem("tteona_token");
  localStorage.removeItem("tteona_user");
}

export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch(`${BASE_URL}/api/upload/photo`, {
    method: "POST",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error("사진 업로드 실패");
  const data = await res.json();
  return data.url;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      (body as { error?: string }).error ?? `HTTP ${res.status}`,
      (body as { code?: string }).code,
      res.status
    );
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getOptional: async <T>(path: string): Promise<T | null> => {
    try { return await request<T>(path); }
    catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
  },
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};
