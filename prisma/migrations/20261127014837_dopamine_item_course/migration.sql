-- CreateEnum
CREATE TYPE "DopamineCourse" AS ENUM ('APPETIZER', 'ENTREE', 'SIDE', 'DESSERT', 'SPECIAL');

-- AlterTable
ALTER TABLE "DopamineMenuItem" ADD COLUMN     "course" "DopamineCourse";
