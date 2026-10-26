import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrganizer } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditEventForm } from "@/components/events/EditEventForm";

export const metadata = {
  title: "Edit Awards Event | Votely",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EditEventPage({ params }: Props) {
  const { eventId } = await params;
  const user = await requireOrganizer();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event || event.organizerId !== user.id) {
    notFound();
  }

  // Format dates for datetime-local input fields (YYYY-MM-DDTHH:mm)
  const initialData = {
    id: event.id,
    name: event.name,
    description: event.description,
    startDate: new Date(event.startDate).toISOString().slice(0, 16),
    endDate: new Date(event.endDate).toISOString().slice(0, 16),
    votingStartsAt: new Date(event.votingStartsAt).toISOString().slice(0, 16),
    votingEndsAt: new Date(event.votingEndsAt).toISOString().slice(0, 16),
    bannerUrl: event.bannerUrl || "",
    logoUrl: event.logoUrl || "",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Cancel & Return to Event</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <Badge variant="glow">Event Configuration</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Edit Event Details
          </h1>
          <p className="text-sm text-slate-400">
            Update information and scheduling for <strong>{event.name}</strong>.
          </p>
        </div>

        <EditEventForm initialData={initialData} />
      </div>
    </div>
  );
}
