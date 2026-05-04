import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
