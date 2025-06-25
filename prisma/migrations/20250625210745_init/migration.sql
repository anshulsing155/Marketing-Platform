-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "subscriber_status" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "campaign_type" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "campaign_status" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'WHATSAPP_DELIVERED', 'WHATSAPP_READ', 'BOUNCED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "role" "role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "status" "subscriber_status" NOT NULL DEFAULT 'ACTIVE',
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_subscribers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "subscriber_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "template_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "template_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "campaign_type" NOT NULL,
    "subject" TEXT,
    "email_template_id" UUID,
    "whatsapp_template_id" UUID,
    "status" "campaign_status" NOT NULL DEFAULT 'DRAFT',
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "total_sent" INTEGER NOT NULL DEFAULT 0,
    "total_delivered" INTEGER NOT NULL DEFAULT 0,
    "total_opened" INTEGER NOT NULL DEFAULT 0,
    "total_clicked" INTEGER NOT NULL DEFAULT 0,
    "total_bounced" INTEGER NOT NULL DEFAULT 0,
    "total_unsubscribed" INTEGER NOT NULL DEFAULT 0,
    "open_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "click_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bounce_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unsubscribe_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber_activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriber_id" UUID NOT NULL,
    "campaign_id" UUID,
    "activity_type" "activity_type" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "subscriber_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "group_subscribers_group_id_subscriber_id_key" ON "group_subscribers"("group_id", "subscriber_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_groups_campaign_id_group_id_key" ON "campaign_groups"("campaign_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_analytics_campaign_id_key" ON "campaign_analytics"("campaign_id");

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_subscribers" ADD CONSTRAINT "group_subscribers_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_subscribers" ADD CONSTRAINT "group_subscribers_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_templates" ADD CONSTRAINT "whatsapp_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "FK_Campaign_EmailTemplate" FOREIGN KEY ("email_template_id") REFERENCES "email_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "FK_Campaign_WhatsAppTemplate" FOREIGN KEY ("whatsapp_template_id") REFERENCES "whatsapp_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_groups" ADD CONSTRAINT "campaign_groups_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_groups" ADD CONSTRAINT "campaign_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_analytics" ADD CONSTRAINT "campaign_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
