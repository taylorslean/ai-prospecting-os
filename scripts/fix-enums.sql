-- Fix missing CampaignStatus and JobStatus enums
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CampaignStatus') THEN
    CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT','RUNNING','PAUSED','COMPLETED','FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JobStatus') THEN
    CREATE TYPE "JobStatus" AS ENUM ('QUEUED','RUNNING','COMPLETED','FAILED');
  END IF;
END $$;

ALTER TABLE "Campaign" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Campaign" ALTER COLUMN "status" TYPE "CampaignStatus" USING "status"::"CampaignStatus";
ALTER TABLE "Campaign" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"CampaignStatus";

ALTER TABLE "CrawlJob" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CrawlJob" ALTER COLUMN "status" TYPE "JobStatus" USING "status"::"JobStatus";
ALTER TABLE "CrawlJob" ALTER COLUMN "status" SET DEFAULT 'QUEUED'::"JobStatus";

COMMIT;
