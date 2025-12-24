-- DropForeignKey
ALTER TABLE "invite_links" DROP CONSTRAINT "invite_links_created_by_id_fkey";

-- AddForeignKey
ALTER TABLE "invite_links" ADD CONSTRAINT "invite_links_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
