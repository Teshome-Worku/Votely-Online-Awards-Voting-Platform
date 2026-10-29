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

  // Aggregate real dynamic event counts for this organizer in a single query
  let total = 0;
  let live = 0;
  let scheduled = 0;
  let drafts = 0;
  let closed = 0;

  try {
    const statusGroups = await prisma.event.groupBy({
      by: ["status"],
      where: { organizerId: user.id },
      _count: { _all: true },
    });

    for (const group of statusGroups) {
      const count = group._count._all;
      total += count;
      if (group.status === "LIVE") live += count;
      else if (group.status === "SCHEDULED") scheduled += count;
      else if (group.status === "DRAFT") drafts += count;
      else if (["CLOSED", "FINALIZED", "ARCHIVED"].includes(group.status)) {
        closed += count;
      }
    }
  } catch (err) {
    console.error("Non-fatal: could not load sidebar counts:", err);
  }

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
