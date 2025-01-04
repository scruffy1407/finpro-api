/*
  Warnings:

  - A unique constraint covering the columns `[invoice_payment]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invoice_transaction]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invoice_payment` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoice_transaction` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription"."Payment" ADD COLUMN     "invoice_payment" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Subscription"."Transaction" ADD COLUMN     "invoice_transaction" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_invoice_payment_key" ON "Subscription"."Payment"("invoice_payment");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_invoice_transaction_key" ON "Subscription"."Transaction"("invoice_transaction");
