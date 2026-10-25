-- CreateEnum
CREATE TYPE "VotingRule" AS ENUM ('ONE_VOTE_PER_CATEGORY', 'ONE_VOTE_PER_EVENT');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "votingRule" "VotingRule" NOT NULL DEFAULT 'ONE_VOTE_PER_CATEGORY';

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voter_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voter_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nomineeId" TEXT NOT NULL,
    "voterPhoneHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "otp_challenges_eventId_phoneNumber_idx" ON "otp_challenges"("eventId", "phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "voter_sessions_token_key" ON "voter_sessions"("token");

-- CreateIndex
CREATE INDEX "voter_sessions_token_idx" ON "voter_sessions"("token");

-- CreateIndex
CREATE INDEX "voter_sessions_eventId_phoneHash_idx" ON "voter_sessions"("eventId", "phoneHash");

-- CreateIndex
CREATE INDEX "votes_eventId_voterPhoneHash_idx" ON "votes"("eventId", "voterPhoneHash");

-- CreateIndex
CREATE INDEX "votes_nomineeId_idx" ON "votes"("nomineeId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_eventId_categoryId_voterPhoneHash_key" ON "votes"("eventId", "categoryId", "voterPhoneHash");

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_nomineeId_fkey" FOREIGN KEY ("nomineeId") REFERENCES "nominees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
