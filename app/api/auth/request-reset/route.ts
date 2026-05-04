import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/invites";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim();

  // Always try — function is silent when email doesn't exist (security)
  await requestPasswordReset(email);

  // Always redirect to "sent" — never reveal if email exists or not
  return NextResponse.redirect(new URL("/redefinir-senha?sent=1", request.url), 303);
}
