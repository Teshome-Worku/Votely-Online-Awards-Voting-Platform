-- DropForeignKey
ALTER TABLE "finalized_result_snapshots" DROP CONSTRAINT "finalized_result_snapshots_finalizedById_fkey";

-- AddForeignKey
ALTER TABLE "finalized_result_snapshots" ADD CONSTRAINT "finalized_result_snapshots_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
