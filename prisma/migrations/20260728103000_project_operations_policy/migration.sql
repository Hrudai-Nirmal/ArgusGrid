-- Project-scoped operations policy for cost/reliability customization.
CREATE TABLE "ProjectOperationsPolicy" (
    "id" TEXT NOT NULL,
    "operationsMode" TEXT NOT NULL DEFAULT 'cost_saver',
    "pollingCadenceMin" INTEGER,
    "notificationReliability" TEXT NOT NULL DEFAULT 'standard',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "spendProtection" TEXT NOT NULL DEFAULT 'use_credits',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectOperationsPolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectOperationsPolicy_projectId_key" ON "ProjectOperationsPolicy"("projectId");
CREATE INDEX "ProjectOperationsPolicy_operationsMode_idx" ON "ProjectOperationsPolicy"("operationsMode");
CREATE INDEX "ProjectOperationsPolicy_notificationReliability_idx" ON "ProjectOperationsPolicy"("notificationReliability");

ALTER TABLE "ProjectOperationsPolicy"
  ADD CONSTRAINT "ProjectOperationsPolicy_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
