-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "push_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "share_email" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "share_phone" BOOLEAN NOT NULL DEFAULT false;
