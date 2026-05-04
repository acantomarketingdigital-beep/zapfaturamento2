import { DashboardLogin } from "@/components/dashboard/DashboardLogin";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { InboxClient } from "@/components/dashboard/InboxClient";
import { getCurrentUser, isAgencyAdmin, isDashboardConfigured } from "@/lib/dashboard-auth";
import { hasDatabaseConfig } from "@/lib/db";

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) return <DashboardLogin configured={isDashboardConfigured()} error="" />;

  return (
    <main className="dashboard-shell" style={{ overflow: "hidden" }}>
      <DashboardSidebar
        activePath="/dashboard/inbox"
        databaseReady={hasDatabaseConfig()}
        user={user}
      />
      <InboxClient isAgencyAdmin={isAgencyAdmin(user)} />
    </main>
  );
}
