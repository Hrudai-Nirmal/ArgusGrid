-- CreateTable
CREATE TABLE "ProjectRemediationAction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actionType" TEXT NOT NULL DEFAULT 'custom_webhook',
    "url" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mode" TEXT NOT NULL DEFAULT 'manual',
    "minimumSeverity" "AlertSeverity" NOT NULL DEFAULT 'CRITICAL',
    "eventFilters" JSONB,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 30,
    "signingSecretEncrypted" TEXT NOT NULL,
    "lastTriggeredAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRemediationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationActionAttempt" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "alertEventId" TEXT,
    "status" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "failureReason" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemediationActionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectRemediationAction_projectId_enabled_idx" ON "ProjectRemediationAction"("projectId", "enabled");

-- CreateIndex
CREATE INDEX "ProjectRemediationAction_projectId_mode_idx" ON "ProjectRemediationAction"("projectId", "mode");

-- CreateIndex
CREATE INDEX "ProjectRemediationAction_minimumSeverity_idx" ON "ProjectRemediationAction"("minimumSeverity");

-- CreateIndex
CREATE UNIQUE INDEX "RemediationActionAttempt_deliveryId_key" ON "RemediationActionAttempt"("deliveryId");

-- CreateIndex
CREATE INDEX "RemediationActionAttempt_projectId_createdAt_idx" ON "RemediationActionAttempt"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "RemediationActionAttempt_alertEventId_createdAt_idx" ON "RemediationActionAttempt"("alertEventId", "createdAt");

-- CreateIndex
CREATE INDEX "RemediationActionAttempt_actionId_createdAt_idx" ON "RemediationActionAttempt"("actionId", "createdAt");

-- CreateIndex
CREATE INDEX "RemediationActionAttempt_status_createdAt_idx" ON "RemediationActionAttempt"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ProjectRemediationAction" ADD CONSTRAINT "ProjectRemediationAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationActionAttempt" ADD CONSTRAINT "RemediationActionAttempt_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ProjectRemediationAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationActionAttempt" ADD CONSTRAINT "RemediationActionAttempt_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationActionAttempt" ADD CONSTRAINT "RemediationActionAttempt_alertEventId_fkey" FOREIGN KEY ("alertEventId") REFERENCES "AlertEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
