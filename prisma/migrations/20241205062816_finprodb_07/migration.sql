-- AlterTable
ALTER TABLE "BaseUsers"."BaseUsers" ADD COLUMN     "email_verification_attempts" INTEGER DEFAULT 0,
ADD COLUMN     "last_attempt_time" TIMESTAMP(3);
