import { requireOrganizer } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { OrganizerShell } from "@/components/dashboard/OrganizerShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOrganizer();

  // Aggregate real dynamic event counts for this authenticated organizer
  const [total, live, scheduled, drafts, closed] = await Promise.all([
    prisma.event.count({
      where: { organizerId: user.id },
    }),
    prisma.event.count({
      where: { organizerId: user.id, status: "LIVE" },
    }),
    prisma.event.count({
      where: { organizerId: user.id, status: "SCHEDULED" },
    }),
    prisma.event.count({
      where: { organizerId: user.id, status: "DRAFT" },
    }),
    prisma.event.count({
      where: {
        organizerId: user.id,
        status: { in: ["CLOSED", "FINALIZED", "ARCHIVED"] },
      },
    }),
  ]);

  return (
    <OrganizerShell
      user={user}
      counts={{
        total,
        live,
        scheduled,
        drafts,
        closed,
      }}
    >
      {children}
    </OrganizerShell>
  );
}
