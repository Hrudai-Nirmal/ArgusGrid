-- CreateTable
CREATE TABLE "PaddleCustomer" (
    "id" TEXT NOT NULL,
    "paddleCustomerId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "userId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaddleCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaddleSubscription" (
    "id" TEXT NOT NULL,
    "paddleSubscriptionId" TEXT NOT NULL,
    "paddleCustomerId" TEXT,
    "status" TEXT NOT NULL,
    "billingKey" TEXT,
    "priceId" TEXT,
    "productId" TEXT,
    "currencyCode" TEXT,
    "currentBillingPeriodStartsAt" TIMESTAMP(3),
    "currentBillingPeriodEndsAt" TIMESTAMP(3),
    "nextBilledAt" TIMESTAMP(3),
    "scheduledChangeAction" TEXT,
    "scheduledChangeEffectiveAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "items" JSONB,
    "customData" JSONB,
    "userId" TEXT,
    "organizationId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaddleSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaddleTransaction" (
    "id" TEXT NOT NULL,
    "paddleTransactionId" TEXT NOT NULL,
    "paddleCustomerId" TEXT,
    "paddleSubscriptionId" TEXT,
    "status" TEXT NOT NULL,
    "billingKey" TEXT,
    "checkoutId" TEXT,
    "creditAmount" INTEGER,
    "priceId" TEXT,
    "productId" TEXT,
    "totalAmount" INTEGER,
    "currencyCode" TEXT,
    "billedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "details" JSONB,
    "customData" JSONB,
    "userId" TEXT,
    "organizationId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaddleTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaddleWebhookEvent" (
    "id" TEXT NOT NULL,
    "paddleEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "resourceId" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "errorSummary" TEXT,
    "occurredAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaddleWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaddleCustomer_paddleCustomerId_key" ON "PaddleCustomer"("paddleCustomerId");
CREATE INDEX "PaddleCustomer_email_idx" ON "PaddleCustomer"("email");
CREATE INDEX "PaddleCustomer_userId_idx" ON "PaddleCustomer"("userId");
CREATE INDEX "PaddleCustomer_organizationId_idx" ON "PaddleCustomer"("organizationId");
CREATE INDEX "PaddleCustomer_environment_idx" ON "PaddleCustomer"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "PaddleSubscription_paddleSubscriptionId_key" ON "PaddleSubscription"("paddleSubscriptionId");
CREATE INDEX "PaddleSubscription_paddleCustomerId_idx" ON "PaddleSubscription"("paddleCustomerId");
CREATE INDEX "PaddleSubscription_userId_idx" ON "PaddleSubscription"("userId");
CREATE INDEX "PaddleSubscription_organizationId_status_idx" ON "PaddleSubscription"("organizationId", "status");
CREATE INDEX "PaddleSubscription_projectId_status_idx" ON "PaddleSubscription"("projectId", "status");
CREATE INDEX "PaddleSubscription_priceId_idx" ON "PaddleSubscription"("priceId");
CREATE INDEX "PaddleSubscription_billingKey_idx" ON "PaddleSubscription"("billingKey");
CREATE INDEX "PaddleSubscription_environment_idx" ON "PaddleSubscription"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "PaddleTransaction_paddleTransactionId_key" ON "PaddleTransaction"("paddleTransactionId");
CREATE INDEX "PaddleTransaction_paddleCustomerId_idx" ON "PaddleTransaction"("paddleCustomerId");
CREATE INDEX "PaddleTransaction_paddleSubscriptionId_idx" ON "PaddleTransaction"("paddleSubscriptionId");
CREATE INDEX "PaddleTransaction_userId_idx" ON "PaddleTransaction"("userId");
CREATE INDEX "PaddleTransaction_organizationId_completedAt_idx" ON "PaddleTransaction"("organizationId", "completedAt");
CREATE INDEX "PaddleTransaction_projectId_completedAt_idx" ON "PaddleTransaction"("projectId", "completedAt");
CREATE INDEX "PaddleTransaction_priceId_idx" ON "PaddleTransaction"("priceId");
CREATE INDEX "PaddleTransaction_billingKey_idx" ON "PaddleTransaction"("billingKey");
CREATE INDEX "PaddleTransaction_environment_idx" ON "PaddleTransaction"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "PaddleWebhookEvent_paddleEventId_key" ON "PaddleWebhookEvent"("paddleEventId");
CREATE INDEX "PaddleWebhookEvent_eventType_createdAt_idx" ON "PaddleWebhookEvent"("eventType", "createdAt");
CREATE INDEX "PaddleWebhookEvent_status_createdAt_idx" ON "PaddleWebhookEvent"("status", "createdAt");
CREATE INDEX "PaddleWebhookEvent_resourceId_idx" ON "PaddleWebhookEvent"("resourceId");
CREATE INDEX "PaddleWebhookEvent_environment_idx" ON "PaddleWebhookEvent"("environment");

-- AddForeignKey
ALTER TABLE "PaddleCustomer" ADD CONSTRAINT "PaddleCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaddleCustomer" ADD CONSTRAINT "PaddleCustomer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaddleSubscription" ADD CONSTRAINT "PaddleSubscription_paddleCustomerId_fkey" FOREIGN KEY ("paddleCustomerId") REFERENCES "PaddleCustomer"("paddleCustomerId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaddleSubscription" ADD CONSTRAINT "PaddleSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaddleSubscription" ADD CONSTRAINT "PaddleSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaddleSubscription" ADD CONSTRAINT "PaddleSubscription_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaddleTransaction" ADD CONSTRAINT "PaddleTransaction_paddleCustomerId_fkey" FOREIGN KEY ("paddleCustomerId") REFERENCES "PaddleCustomer"("paddleCustomerId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaddleTransaction" ADD CONSTRAINT "PaddleTransaction_paddleSubscriptionId_fkey" FOREIGN KEY ("paddleSubscriptionId") REFERENCES "PaddleSubscription"("paddleSubscriptionId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaddleTransaction" ADD CONSTRAINT "PaddleTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaddleTransaction" ADD CONSTRAINT "PaddleTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaddleTransaction" ADD CONSTRAINT "PaddleTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
