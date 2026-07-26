CREATE TABLE "IngestionRateLimitBucket" (
    "id" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionRateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IngestionRateLimitBucket_scopeType_scopeId_windowStart_key" ON "IngestionRateLimitBucket"("scopeType", "scopeId", "windowStart");
CREATE INDEX "IngestionRateLimitBucket_projectId_windowStart_idx" ON "IngestionRateLimitBucket"("projectId", "windowStart");
CREATE INDEX "IngestionRateLimitBucket_windowStart_idx" ON "IngestionRateLimitBucket"("windowStart");

ALTER TABLE "IngestionRateLimitBucket" ADD CONSTRAINT "IngestionRateLimitBucket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
