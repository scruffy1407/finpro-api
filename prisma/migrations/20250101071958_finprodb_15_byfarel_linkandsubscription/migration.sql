-- AlterTable
ALTER TABLE "Subscription"."JobHunterSubscription" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription"."Transaction" ADD COLUMN     "redirect_link" TEXT;
