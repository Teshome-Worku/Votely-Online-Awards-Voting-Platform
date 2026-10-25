"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { VotingModal } from "./VotingModal";
import { Users, Check } from "lucide-react";
import type { EventStatus } from "@prisma/client";

interface NomineeItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  nominees: NomineeItem[];
}

interface Props {
  eventId: string;
  eventName: string;
  eventStatus: EventStatus;
  categories: CategoryItem[];
}

export function PublicEventVoting({ eventId, eventName, eventStatus, categories }: Props) {
  const [selectedNominee, setSelectedNominee] = React.useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
    categoryName: string;
    categoryId: string;
  } | null>(null);

  const isLive = eventStatus === "LIVE";

  return (
    <>
      <div className="space-y-8">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-3xl border border-slate-800 bg-[#0b1022] p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                {cat.description && (
                  <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {cat.nominees.length} Nominee{cat.nominees.length === 1 ? "" : "s"}
              </span>
            </div>

            {cat.nominees.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">
                No nominees rostered in this category yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.nominees.map((nom) => (
                  <div
                    key={nom.id}
                    className="rounded-2xl border border-slate-800 bg-[#0e162c] p-4 flex flex-col justify-between hover:border-violet-500/40 transition-all shadow-md group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        {nom.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={nom.imageUrl}
                            alt={nom.name}
                            className="h-12 w-12 rounded-xl object-cover border border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                            <Users className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                            {nom.name}
                          </h4>
                        </div>
                      </div>

                      {nom.description && (
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {nom.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-800/80">
                      {isLive ? (
                        <Button
                          variant="primaryGlow"
                          size="sm"
                          onClick={() =>
                            setSelectedNominee({
                              id: nom.id,
                              name: nom.name,
                              imageUrl: nom.imageUrl,
                              categoryName: cat.name,
                              categoryId: cat.id,
                            })
                          }
                          className="w-full text-xs justify-center flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Vote with Phone OTP</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full text-xs justify-center opacity-60 cursor-not-allowed"
                        >
                          {eventStatus === "CLOSED" || eventStatus === "FINALIZED"
                            ? "Voting Concluded"
                            : "Voting Not Open"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Interactive Voting Modal */}
      {selectedNominee && (
        <VotingModal
          eventId={eventId}
          eventName={eventName}
          selectedNominee={selectedNominee}
          onClose={() => setSelectedNominee(null)}
        />
      )}
    </>
  );
}
