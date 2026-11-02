import type { ApiError } from "@civicpulse/contract";
import { supabase } from "./supabase";

/**
 * API address from VITE_API_URL. Tolerates a missing "https://" and a trailing slash.
 * An empty value in a production build is a misconfiguration: relative URLs would hit the web
 * site itself (which answers every path with index.html), so we fail loudly instead.
 */
function resolveBase(): string {
  let raw = String(import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!raw) return import.meta.env.DEV ? "http://localhost:4000" : "";
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  return raw;
}

const BASE = resolveBase();

/** Thin fetch wrapper. Adds the signed-in user's token automatically. Shapes come from @civicpulse/contract. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) {
    throw new Error("The app has no API address configured (VITE_API_URL). Please tell the site administrator.");
  }
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const { headers, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw new Error(body?.error.message ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  if (!res.headers.get("content-type")?.includes("application/json")) {
    throw new Error("The server returned an unexpected response. The API address may be wrong.");
  }
  return (await res.json()) as T;
}

export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
