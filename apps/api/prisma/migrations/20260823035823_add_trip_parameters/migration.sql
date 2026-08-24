/*
  Warnings:

  - You are about to drop the column `numTravelers` on the `Proposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "numTravelers",
ADD COLUMN     "accessibilityNeeds" TEXT,
ADD COLUMN     "accommodationType" TEXT NOT NULL DEFAULT 'mid_range',
ADD COLUMN     "cabinClass" TEXT NOT NULL DEFAULT 'economy',
ADD COLUMN     "childrenAges" JSONB,
ADD COLUMN     "dietaryRestrictions" JSONB,
ADD COLUMN     "directFlightsOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "numAdults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "numChildren" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "numRooms" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pace" TEXT NOT NULL DEFAULT 'moderate',
ADD COLUMN     "specialOccasion" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "specialRequests" TEXT,
ADD COLUMN     "tripType" TEXT NOT NULL DEFAULT 'round_trip';
