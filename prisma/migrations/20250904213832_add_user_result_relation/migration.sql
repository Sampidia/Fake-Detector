-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentGateway" AS ENUM ('PAYSTACK', 'FLUTTERWAVE');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('EXACT', 'SEMANTIC', 'BATCH', 'FUZZY', 'HYBRID');

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" VARCHAR(500) NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "emailVerified" TIMESTAMPTZ(6),
    "image" TEXT,
    "pointsBalance" INTEGER NOT NULL DEFAULT 5,
    "dailyPointsLastGiven" VARCHAR(20) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScraperStatus" (
    "id" TEXT NOT NULL,
    "isScraping" BOOLEAN NOT NULL DEFAULT false,
    "lastScrapedAt" TIMESTAMPTZ(6),
    "lastError" TEXT,
    "lastUpdated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScraperStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."ProductCheck" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "productName" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "images" TEXT[],
    "pointsUsed" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchNumber" VARCHAR(100),
    "deviceInfo" JSONB,
    "ipAddress" VARCHAR(45),
    "location" VARCHAR(100),

    CONSTRAINT "ProductCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CheckResult" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "productCheckId" VARCHAR(255) NOT NULL,
    "isCounterfeit" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL DEFAULT 'https://nafdac.gov.ng/category/recalls-and-alerts/',
    "source" VARCHAR(50) NOT NULL DEFAULT 'NAFDAC',
    "batchNumber" VARCHAR(100),
    "issueDate" VARCHAR(20),
    "alertType" VARCHAR(50) NOT NULL DEFAULT 'No Alert',
    "images" TEXT[],
    "confidence" DOUBLE PRECISION,
    "scrapedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "pointsPurchased" INTEGER NOT NULL,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentGateway" "public"."PaymentGateway" NOT NULL,
    "transactionId" VARCHAR(255) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN',
    "gatewayResponse" JSONB,
    "webhookProcessed" BOOLEAN NOT NULL DEFAULT false,
    "callbackUrl" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NafdacAlert" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "date" VARCHAR(20) NOT NULL,
    "image" TEXT,
    "fullContent" TEXT,
    "cleanContent" TEXT,
    "productNames" TEXT[],
    "brandNames" TEXT[],
    "batchNumbers" TEXT[],
    "serialNumbers" TEXT[],
    "categories" TEXT[],
    "severity" VARCHAR(50) NOT NULL,
    "regions" TEXT[],
    "manufacturer" VARCHAR(255),
    "drugNames" TEXT[],
    "expiryDates" TEXT[],
    "embed_title" JSONB,
    "embed_content" JSONB,
    "similarity_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "batchNumber" VARCHAR(100),
    "alertType" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'recalls',
    "region" VARCHAR(100),
    "scrapedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMPTZ(6) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NafdacAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NafdacVerification" (
    "id" TEXT NOT NULL,
    "alertId" VARCHAR(255) NOT NULL,
    "productCheckId" VARCHAR(255) NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "matchType" "public"."MatchType" NOT NULL DEFAULT 'FUZZY',
    "confidence" DOUBLE PRECISION NOT NULL,
    "verifiedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NafdacVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE INDEX "Account_provider_providerAccountId_idx" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_sessionToken_idx" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "public"."Session"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_pointsBalance_idx" ON "public"."User"("pointsBalance");

-- CreateIndex
CREATE INDEX "User_dailyPointsLastGiven_idx" ON "public"."User"("dailyPointsLastGiven");

-- CreateIndex
CREATE INDEX "User_onboardingComplete_idx" ON "public"."User"("onboardingComplete");

-- CreateIndex
CREATE INDEX "ScraperStatus_isScraping_idx" ON "public"."ScraperStatus"("isScraping");

-- CreateIndex
CREATE INDEX "ScraperStatus_lastScrapedAt_idx" ON "public"."ScraperStatus"("lastScrapedAt");

-- CreateIndex
CREATE INDEX "ScraperStatus_lastUpdated_idx" ON "public"."ScraperStatus"("lastUpdated");

-- CreateIndex
CREATE INDEX "ProductCheck_userId_idx" ON "public"."ProductCheck"("userId");

-- CreateIndex
CREATE INDEX "ProductCheck_createdAt_idx" ON "public"."ProductCheck"("createdAt");

-- CreateIndex
CREATE INDEX "ProductCheck_batchNumber_idx" ON "public"."ProductCheck"("batchNumber");

-- CreateIndex
CREATE INDEX "ProductCheck_ipAddress_idx" ON "public"."ProductCheck"("ipAddress");

-- CreateIndex
CREATE INDEX "ProductCheck_userId_createdAt_idx" ON "public"."ProductCheck"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductCheck_createdAt_userId_idx" ON "public"."ProductCheck"("createdAt", "userId");

-- CreateIndex
CREATE INDEX "CheckResult_userId_idx" ON "public"."CheckResult"("userId");

-- CreateIndex
CREATE INDEX "CheckResult_productCheckId_idx" ON "public"."CheckResult"("productCheckId");

-- CreateIndex
CREATE INDEX "CheckResult_isCounterfeit_idx" ON "public"."CheckResult"("isCounterfeit");

-- CreateIndex
CREATE INDEX "CheckResult_batchNumber_idx" ON "public"."CheckResult"("batchNumber");

-- CreateIndex
CREATE INDEX "CheckResult_alertType_idx" ON "public"."CheckResult"("alertType");

-- CreateIndex
CREATE INDEX "CheckResult_confidence_idx" ON "public"."CheckResult"("confidence");

-- CreateIndex
CREATE INDEX "CheckResult_scrapedAt_idx" ON "public"."CheckResult"("scrapedAt");

-- CreateIndex
CREATE INDEX "CheckResult_isCounterfeit_confidence_idx" ON "public"."CheckResult"("isCounterfeit", "confidence");

-- CreateIndex
CREATE INDEX "CheckResult_productCheckId_scrapedAt_idx" ON "public"."CheckResult"("productCheckId", "scrapedAt");

-- CreateIndex
CREATE INDEX "CheckResult_userId_scrapedAt_idx" ON "public"."CheckResult"("userId", "scrapedAt");

-- CreateIndex
CREATE INDEX "CheckResult_userId_isCounterfeit_idx" ON "public"."CheckResult"("userId", "isCounterfeit");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "public"."Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "public"."Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "public"."Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "public"."Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_webhookProcessed_idx" ON "public"."Payment"("webhookProcessed");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "public"."Payment"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NafdacAlert_url_key" ON "public"."NafdacAlert"("url");

-- CreateIndex
CREATE INDEX "NafdacAlert_active_idx" ON "public"."NafdacAlert"("active");

-- CreateIndex
CREATE INDEX "NafdacAlert_alertType_idx" ON "public"."NafdacAlert"("alertType");

-- CreateIndex
CREATE INDEX "NafdacAlert_severity_idx" ON "public"."NafdacAlert"("severity");

-- CreateIndex
CREATE INDEX "NafdacAlert_category_idx" ON "public"."NafdacAlert"("category");

-- CreateIndex
CREATE INDEX "NafdacAlert_batchNumber_idx" ON "public"."NafdacAlert"("batchNumber");

-- CreateIndex
CREATE INDEX "NafdacAlert_manufacturer_idx" ON "public"."NafdacAlert"("manufacturer");

-- CreateIndex
CREATE INDEX "NafdacAlert_region_idx" ON "public"."NafdacAlert"("region");

-- CreateIndex
CREATE INDEX "NafdacAlert_scrapedAt_idx" ON "public"."NafdacAlert"("scrapedAt");

-- CreateIndex
CREATE INDEX "NafdacAlert_lastUpdated_idx" ON "public"."NafdacAlert"("lastUpdated");

-- CreateIndex
CREATE INDEX "NafdacAlert_similarity_score_idx" ON "public"."NafdacAlert"("similarity_score");

-- CreateIndex
CREATE INDEX "NafdacAlert_active_scrapedAt_idx" ON "public"."NafdacAlert"("active", "scrapedAt");

-- CreateIndex
CREATE INDEX "NafdacAlert_alertType_severity_idx" ON "public"."NafdacAlert"("alertType", "severity");

-- CreateIndex
CREATE INDEX "NafdacAlert_batchNumber_active_idx" ON "public"."NafdacAlert"("batchNumber", "active");

-- CreateIndex
CREATE INDEX "NafdacAlert_category_region_idx" ON "public"."NafdacAlert"("category", "region");

-- CreateIndex
CREATE INDEX "NafdacAlert_manufacturer_active_idx" ON "public"."NafdacAlert"("manufacturer", "active");

-- CreateIndex
CREATE INDEX "NafdacVerification_alertId_idx" ON "public"."NafdacVerification"("alertId");

-- CreateIndex
CREATE INDEX "NafdacVerification_productCheckId_idx" ON "public"."NafdacVerification"("productCheckId");

-- CreateIndex
CREATE INDEX "NafdacVerification_matchType_idx" ON "public"."NafdacVerification"("matchType");

-- CreateIndex
CREATE INDEX "NafdacVerification_confidence_idx" ON "public"."NafdacVerification"("confidence");

-- CreateIndex
CREATE INDEX "NafdacVerification_verifiedAt_idx" ON "public"."NafdacVerification"("verifiedAt");

-- CreateIndex
CREATE INDEX "NafdacVerification_alertId_productCheckId_idx" ON "public"."NafdacVerification"("alertId", "productCheckId");

-- CreateIndex
CREATE INDEX "NafdacVerification_similarityScore_confidence_idx" ON "public"."NafdacVerification"("similarityScore", "confidence");

-- AddForeignKey
ALTER TABLE "public"."ProductCheck" ADD CONSTRAINT "ProductCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckResult" ADD CONSTRAINT "CheckResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckResult" ADD CONSTRAINT "CheckResult_productCheckId_fkey" FOREIGN KEY ("productCheckId") REFERENCES "public"."ProductCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
