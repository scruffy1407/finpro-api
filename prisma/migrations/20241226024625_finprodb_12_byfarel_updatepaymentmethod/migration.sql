/*
  Warnings:

  - The values [creditcard,bca,mandiri] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Subscription"."PaymentMethod_new" AS ENUM ('bank_transfer', 'qris', 'gopay', 'shopeepay', 'credit_card');
ALTER TABLE "Subscription"."Payment" ALTER COLUMN "payment_method" TYPE "Subscription"."PaymentMethod_new" USING ("payment_method"::text::"Subscription"."PaymentMethod_new");
ALTER TYPE "Subscription"."PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "Subscription"."PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "Subscription"."PaymentMethod_old";
COMMIT;

-- AlterTable
ALTER TABLE "Subscription"."Payment" ADD COLUMN     "bank" TEXT;
