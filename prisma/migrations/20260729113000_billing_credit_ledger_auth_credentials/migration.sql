-- CreateTable
CREATE TABLE "UserPasswordCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPasswordCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCreditLedgerEntry" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "resource" TEXT,
    "description" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "metadata" JSONB,
    "paddleTransactionId" TEXT,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingCreditLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPasswordCredential_userId_key" ON "UserPasswordCredential"("userId");

-- CreateIndex
CREATE INDEX "UserPasswordCredential_userId_idx" ON "UserPasswordCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCreditLedgerEntry_idempotencyKey_key" ON "BillingCreditLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BillingCreditLedgerEntry_organizationId_createdAt_idx" ON "BillingCreditLedgerEntry"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingCreditLedgerEntry_projectId_createdAt_idx" ON "BillingCreditLedgerEntry"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "BillingCreditLedgerEntry_paddleTransactionId_idx" ON "BillingCreditLedgerEntry"("paddleTransactionId");

-- CreateIndex
CREATE INDEX "BillingCreditLedgerEntry_resource_createdAt_idx" ON "BillingCreditLedgerEntry"("resource", "createdAt");

-- CreateIndex
CREATE INDEX "BillingCreditLedgerEntry_source_createdAt_idx" ON "BillingCreditLedgerEntry"("source", "createdAt");

-- AddForeignKey
ALTER TABLE "UserPasswordCredential" ADD CONSTRAINT "UserPasswordCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCreditLedgerEntry" ADD CONSTRAINT "BillingCreditLedgerEntry_paddleTransactionId_fkey" FOREIGN KEY ("paddleTransactionId") REFERENCES "PaddleTransaction"("paddleTransactionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCreditLedgerEntry" ADD CONSTRAINT "BillingCreditLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCreditLedgerEntry" ADD CONSTRAINT "BillingCreditLedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCreditLedgerEntry" ADD CONSTRAINT "BillingCreditLedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
