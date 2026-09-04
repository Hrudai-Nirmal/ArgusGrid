CREATE TABLE "runtime_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "job_backend" TEXT NOT NULL DEFAULT 'inngest',
  "self_hosted_worker_url" TEXT,
  "background_recovery_mode" TEXT NOT NULL DEFAULT 'manual',
  "retention_cleanup_mode" TEXT NOT NULL DEFAULT 'manual',
  "polling_mode" TEXT NOT NULL DEFAULT 'disabled',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "runtime_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "runtime_settings_job_backend_check" CHECK ("job_backend" IN ('inngest', 'self_hosted', 'manual')),
  CONSTRAINT "runtime_settings_background_recovery_mode_check" CHECK ("background_recovery_mode" IN ('automatic', 'manual', 'disabled')),
  CONSTRAINT "runtime_settings_retention_cleanup_mode_check" CHECK ("retention_cleanup_mode" IN ('automatic', 'manual', 'disabled')),
  CONSTRAINT "runtime_settings_polling_mode_check" CHECK ("polling_mode" IN ('automatic', 'manual', 'disabled'))
);
