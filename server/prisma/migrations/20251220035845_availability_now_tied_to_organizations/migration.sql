/*
  Warnings:

  - You are about to drop the column `schedule_id` on the `availability` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id,day_of_week]` on the table `availability` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "availability" DROP CONSTRAINT "availability_schedule_id_fkey";

-- DropIndex
DROP INDEX "availability_employee_id_schedule_id_day_of_week_key";

-- AlterTable
ALTER TABLE "availability" DROP COLUMN "schedule_id";

-- CreateIndex
CREATE UNIQUE INDEX "availability_employee_id_day_of_week_key" ON "availability"("employee_id", "day_of_week");
