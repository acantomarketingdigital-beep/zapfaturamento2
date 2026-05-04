import { NextResponse } from "next/server";
import { createDashboardLoginResponse, type AppSession } from "@/lib/dashboard-auth";
import { validateAndUseMagicToken } from "@/lib/invites";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=magic_invalid", request.url));
  }

  const result = await validateAndUseMagicToken(token);

  if (!result) {
    return NextResponse.redirect(new URL("/login?error=magic_invalid", request.url));
  }

  const session: AppSession = {
    kind: "user",
    id: result.id,
    email: result.email,
    role: result.role,
    clientSlug: result.clientSlug
  };

  return createDashboardLoginResponse(session, "/dashboard", request.url);
}
