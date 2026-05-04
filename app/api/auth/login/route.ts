import { NextResponse } from "next/server";
import {
  authenticateAppUser,
  createDashboardLoginResponse,
  isDashboardConfigured
} from "@/lib/dashboard-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!isDashboardConfigured()) {
    return NextResponse.redirect(new URL("/login?error=config", request.url), 303);
  }

  const session = await authenticateAppUser(email, password);

  if (!session) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url), 303);
  }

  return createDashboardLoginResponse(session, "/dashboard", request.url);
}
