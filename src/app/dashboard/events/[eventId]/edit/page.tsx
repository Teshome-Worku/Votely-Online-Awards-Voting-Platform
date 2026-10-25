import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrganizer } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { Award, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#0a0e1e] px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/40">
              <Award className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Votely</span>
          </Link>
          <Link
            href={`/dashboard/events/${event.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Cancel & Return</span>
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
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
      </main>
    </div>
  );
}
