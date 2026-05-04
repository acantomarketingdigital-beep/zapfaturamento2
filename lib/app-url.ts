import { headers } from "next/headers";

export async function getBaseUrlFromHeaders() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.trim().replace(/\/$/, "");
  }

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") || "https";
  const host =
    headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000";

  return `${protocol}://${host}`;
}

export function getSafeDashboardRedirect(
  input: FormDataEntryValue | null,
  fallback: string
) {
  const value = typeof input === "string" ? input.trim() : "";

  if (!value.startsWith("/dashboard")) {
    return fallback;
  }

  return value || fallback;
}
