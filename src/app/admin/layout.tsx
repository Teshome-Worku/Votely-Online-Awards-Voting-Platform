import { requirePlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/dashboard/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await requirePlatformAdmin();

  const [totalUsers, organizersCount, adminsCount, totalEvents, auditLogsCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ORGANIZER" } }),
      prisma.user.count({ where: { role: "PLATFORM_ADMIN" } }),
      prisma.event.count(),
      prisma.auditLog.count(),
    ]);

  return (
    <AdminShell
      user={adminUser}
      stats={{
        totalUsers,
        organizersCount,
        adminsCount,
        totalEvents,
        auditLogsCount,
      }}
    >
      {children}
    </AdminShell>
  );
}
