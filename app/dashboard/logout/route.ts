import { clearDashboardSession } from "@/lib/dashboard-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return clearDashboardSession("/login", request.url);
}
