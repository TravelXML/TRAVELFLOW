-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandingLogoUrl" TEXT,
    "brandingPrimaryColor" TEXT NOT NULL DEFAULT '#1e90ff',
    "brandingSecondaryColor" TEXT NOT NULL DEFAULT '#4ecdc4',
    "brandingAgencyName" TEXT,
    "bookingComAffiliateId" TEXT,
    "getYourGuideAffiliateId" TEXT,
    "skyscannerAffiliateId" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'starter',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionStartedAt" TIMESTAMP(3),
    "subscriptionNextBilling" TIMESTAMP(3),
    "proposalsMonthCount" INTEGER NOT NULL DEFAULT 0,
    "proposalsMonthLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "destinationName" TEXT NOT NULL,
    "travelStartDate" TIMESTAMP(3) NOT NULL,
    "travelEndDate" TIMESTAMP(3) NOT NULL,
    "numTravelers" INTEGER NOT NULL DEFAULT 1,
    "preferences" JSONB,
    "budgetTotal" DECIMAL(65,30),
    "itineraryJson" JSONB,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "bookingValue" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingLink" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "shortUrl" TEXT NOT NULL,
    "utmSource" TEXT NOT NULL DEFAULT 'travelflow',
    "utmMedium" TEXT NOT NULL DEFAULT 'proposal',
    "utmCampaign" TEXT,
    "affiliateProgram" TEXT,
    "itemId" TEXT,
    "itemType" TEXT,
    "itemName" TEXT,
    "itemPrice" DECIMAL(65,30),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "firstClickedAt" TIMESTAMP(3),
    "lastClickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "mailgunMessageId" TEXT,
    "trackingPixelId" TEXT NOT NULL,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "firstOpenedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
    "bounceReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Proposal_userId_idx" ON "Proposal"("userId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "Proposal_createdAt_idx" ON "Proposal"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackingLink_shortUrl_key" ON "TrackingLink"("shortUrl");

-- CreateIndex
CREATE INDEX "TrackingLink_proposalId_idx" ON "TrackingLink"("proposalId");

-- CreateIndex
CREATE INDEX "TrackingLink_shortUrl_idx" ON "TrackingLink"("shortUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Email_proposalId_key" ON "Email"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_trackingPixelId_key" ON "Email"("trackingPixelId");

-- CreateIndex
CREATE INDEX "Email_proposalId_idx" ON "Email"("proposalId");

-- CreateIndex
CREATE INDEX "Email_trackingPixelId_idx" ON "Email"("trackingPixelId");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingLink" ADD CONSTRAINT "TrackingLink_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingLink" ADD CONSTRAINT "TrackingLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
