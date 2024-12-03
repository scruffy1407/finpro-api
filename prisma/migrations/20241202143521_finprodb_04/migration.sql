-- AlterTable
ALTER TABLE "BaseUsers"."BaseUsers" ADD COLUMN     "reset_password_token" TEXT;

-- AlterTable
ALTER TABLE "Subscription"."JobHunterSubscription" ALTER COLUMN "subscription_start_date" DROP NOT NULL,
ALTER COLUMN "subscription_start_date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "subscription_end_date" DROP NOT NULL,
ALTER COLUMN "subscription_end_date" SET DEFAULT CURRENT_TIMESTAMP;
