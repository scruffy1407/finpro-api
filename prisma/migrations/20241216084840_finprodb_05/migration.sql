/*
  Warnings:

  - The values [premium] on the enum `SubscriptionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Subscription"."SubscriptionType_new" AS ENUM ('free', 'standard', 'professional');
ALTER TABLE "Subscription"."SubscriptionTable" ALTER COLUMN "subscription_type" DROP DEFAULT;
ALTER TABLE "Subscription"."SubscriptionTable" ALTER COLUMN "subscription_type" TYPE "Subscription"."SubscriptionType_new" USING ("subscription_type"::text::"Subscription"."SubscriptionType_new");
ALTER TYPE "Subscription"."SubscriptionType" RENAME TO "SubscriptionType_old";
ALTER TYPE "Subscription"."SubscriptionType_new" RENAME TO "SubscriptionType";
DROP TYPE "Subscription"."SubscriptionType_old";
ALTER TABLE "Subscription"."SubscriptionTable" ALTER COLUMN "subscription_type" SET DEFAULT 'free';
COMMIT;
