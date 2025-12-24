-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('TEMPLATE', 'DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "template_name" TEXT,
ADD COLUMN     "type" "ScheduleType" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "week_start_date" DROP NOT NULL,
ALTER COLUMN "availability_deadline" DROP NOT NULL;
