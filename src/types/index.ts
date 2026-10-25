/**
 * Core domain types for Votely (Version 1.0)
 */

export type EventStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "closed"
  | "finalized"
  | "results_published"
  | "archived";

export type VotingLimitRule =
  | "one_vote_per_category"       // Default rule: 1 vote per verified phone number per category
  | "one_vote_per_event"          // 1 vote per verified phone number across entire event
  | "daily_one_vote_per_category"; // 1 vote per verified phone number per category per calendar day

export interface Category {
  id: string;
  eventId: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  nomineesCount?: number;
}

export interface Nominee {
  id: string;
  categoryId: string;
  eventId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface PublicAwardEvent {
  id: string;
  name: string;
  slug: string;
  description: string;
  organizerName: string;
  bannerUrl?: string;
  logoUrl?: string;
  status: EventStatus;
  votingRule: VotingLimitRule;
  startDate: string;
  endDate: string;
  votingStartsAt: string;
  votingEndsAt: string;
  categoriesCount: number;
  nomineesCount: number;
  isFeatured?: boolean;
}
