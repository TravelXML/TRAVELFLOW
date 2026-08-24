-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "hotelAmbiance" TEXT NOT NULL DEFAULT 'any',
ADD COLUMN     "maxDistanceFromAirportKm" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "maxDistanceFromCenterKm" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "numSeniors" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferredAirlines" JSONB,
ADD COLUMN     "priceRangeMax" DECIMAL(65,30),
ADD COLUMN     "priceRangeMin" DECIMAL(65,30);
