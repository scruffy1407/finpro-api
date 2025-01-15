-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Application";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "BaseUsers";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Company";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Developer";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "JobHunter";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Location";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "PreSelectionTest";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "SkillAssessment";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "Subscription";

-- CreateEnum
CREATE TYPE "BaseUsers"."RegisterBy" AS ENUM ('email', 'google');

-- CreateEnum
CREATE TYPE "BaseUsers"."RoleType" AS ENUM ('jobhunter', 'company', 'developer');

-- CreateEnum
CREATE TYPE "JobHunter"."Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "Company"."JobType" AS ENUM ('fulltime', 'freelance', 'internship');

-- CreateEnum
CREATE TYPE "Company"."JobSpace" AS ENUM ('remoteworking', 'onoffice', 'hybrid');

-- CreateEnum
CREATE TYPE "Application"."ApplicationStatus" AS ENUM ('failed', 'onreview', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "SkillAssessment"."CompletionStatusSkillAssessment" AS ENUM ('failed', 'pass');

-- CreateEnum
CREATE TYPE "PreSelectionTest"."CompletionStatusPreSelectionTest" AS ENUM ('failed', 'pass');

-- CreateEnum
CREATE TYPE "PreSelectionTest"."InterviewStatus" AS ENUM ('scheduled', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "JobHunter"."EducationDegree" AS ENUM ('lessthanhighschool', 'highschool', 'vocational', 'associatedegree', 'bachelordegree', 'masterdegree', 'doctoratedegree');

-- CreateEnum
CREATE TYPE "Subscription"."SubscriptionType" AS ENUM ('free', 'standard', 'premium');

-- CreateEnum
CREATE TYPE "Subscription"."TransactionStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "Subscription"."PaymentMethod" AS ENUM ('creditcard', 'gopay', 'bca', 'mandiri', 'qris');

-- CreateEnum
CREATE TYPE "Subscription"."PaymentStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateEnum
CREATE TYPE "Company"."CompanyIndustry" AS ENUM ('informationtechnologyandservices', 'financeandbanking', 'businessandhr', 'hospitalandhealthcare', 'constructionandrealestate', 'retaillogisticandconsumergoods', 'educationandresearch', 'manufacturingandengineering', 'mediaandentertainment', 'governmentandnonprofit', 'others');

-- CreateEnum
CREATE TYPE "Company"."CompanySize" AS ENUM ('small', 'smallmedium', 'medium', 'large', 'enterprise');

-- CreateTable
CREATE TABLE "BaseUsers"."BaseUsers" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "register_by" "BaseUsers"."RegisterBy" NOT NULL DEFAULT 'email',
    "role_type" "BaseUsers"."RoleType" NOT NULL DEFAULT 'jobhunter',
    "phone_number" TEXT,
    "password" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "google_id" TEXT,
    "oauth_token" TEXT,
    "reset_password_token" TEXT,
    "verification_token" TEXT,
    "email_verification_attempts" INTEGER DEFAULT 0,
    "last_attempt_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaseUsers_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "JobHunter"."JobHunter" (
    "job_hunter_id" SERIAL NOT NULL,
    "jobHunterSubscriptionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" "JobHunter"."Gender",
    "photo" TEXT,
    "password" TEXT NOT NULL,
    "location_city" TEXT,
    "location_province" TEXT,
    "cityId" INTEGER,
    "expected_salary" DECIMAL(10,2) DEFAULT 0,
    "summary" TEXT,
    "resume" TEXT,

    CONSTRAINT "JobHunter_pkey" PRIMARY KEY ("job_hunter_id")
);

-- CreateTable
CREATE TABLE "Developer"."Developer" (
    "developer_id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "developer_name" TEXT NOT NULL,

    CONSTRAINT "Developer_pkey" PRIMARY KEY ("developer_id")
);

-- CreateTable
CREATE TABLE "JobHunter"."WorkExperience" (
    "work_experience_id" SERIAL NOT NULL,
    "jobHunterId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "job_title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "job_description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkExperience_pkey" PRIMARY KEY ("work_experience_id")
);

-- CreateTable
CREATE TABLE "JobHunter"."Education" (
    "education_id" SERIAL NOT NULL,
    "jobHunterId" INTEGER NOT NULL,
    "education_degree" "JobHunter"."EducationDegree" NOT NULL,
    "education_name" TEXT NOT NULL,
    "education_description" TEXT NOT NULL,
    "cumulative_gpa" DECIMAL(3,2) NOT NULL,
    "graduation_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("education_id")
);

-- CreateTable
CREATE TABLE "JobHunter"."JobWishlist" (
    "wishlist_id" SERIAL NOT NULL,
    "jobHunterId" INTEGER NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "date_added" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobWishlist_pkey" PRIMARY KEY ("wishlist_id")
);

-- CreateTable
CREATE TABLE "JobHunter"."JobReview" (
    "review_id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "jobHunterId" INTEGER NOT NULL,
    "review_title" TEXT NOT NULL,
    "review_description" TEXT NOT NULL,
    "cultural_rating" INTEGER NOT NULL,
    "work_balance_rating" INTEGER NOT NULL,
    "facility_rating" INTEGER NOT NULL,
    "career_path_rating" INTEGER NOT NULL,

    CONSTRAINT "JobReview_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "JobHunter"."CvGenerated" (
    "cv_id" SERIAL NOT NULL,
    "jobHunterId" INTEGER NOT NULL,

    CONSTRAINT "CvGenerated_pkey" PRIMARY KEY ("cv_id")
);

-- CreateTable
CREATE TABLE "Subscription"."SubscriptionTable" (
    "subscription_id" SERIAL NOT NULL,
    "subscription_type" "Subscription"."SubscriptionType" NOT NULL DEFAULT 'free',
    "subscription_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionTable_pkey" PRIMARY KEY ("subscription_id")
);

-- CreateTable
CREATE TABLE "Subscription"."JobHunterSubscription" (
    "job_hunter_subscription_id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "subscription_active" BOOLEAN NOT NULL DEFAULT false,
    "subscription_start_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "subscription_end_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobHunterSubscription_pkey" PRIMARY KEY ("job_hunter_subscription_id")
);

-- CreateTable
CREATE TABLE "Subscription"."Transaction" (
    "transaction_id" SERIAL NOT NULL,
    "jobHunterId" INTEGER NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "transaction_status" "Subscription"."TransactionStatus" NOT NULL DEFAULT 'pending',
    "transaction_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "Subscription"."Payment" (
    "payment_id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "payment_method" "Subscription"."PaymentMethod" NOT NULL,
    "payment_amount" DECIMAL(10,2) NOT NULL,
    "payment_status" "Subscription"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "SkillAssessment"."SkillAssessment" (
    "skill_assessment_id" SERIAL NOT NULL,
    "developerId" INTEGER NOT NULL,
    "skill_assessment_name" TEXT NOT NULL,
    "skill_badge" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillAssessment_pkey" PRIMARY KEY ("skill_assessment_id")
);

-- CreateTable
CREATE TABLE "SkillAssessment"."SkillAsessmentQuestion" (
    "skill_assessment_question_id" SERIAL NOT NULL,
    "skillAssessmentId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer_1" TEXT NOT NULL,
    "answer_2" TEXT NOT NULL,
    "answer_3" TEXT NOT NULL,
    "answer_4" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillAsessmentQuestion_pkey" PRIMARY KEY ("skill_assessment_question_id")
);

-- CreateTable
CREATE TABLE "SkillAssessment"."SkillAsessmentCompletion" (
    "skill_assessment_completion_id" SERIAL NOT NULL,
    "skillAssessmentId" INTEGER NOT NULL,
    "jobHunterId" INTEGER NOT NULL,
    "completion_status" "SkillAssessment"."CompletionStatusSkillAssessment" NOT NULL,
    "completion_score" INTEGER NOT NULL,
    "completion_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillAsessmentCompletion_pkey" PRIMARY KEY ("skill_assessment_completion_id")
);

-- CreateTable
CREATE TABLE "SkillAssessment"."Certificate" (
    "certificate_id" SERIAL NOT NULL,
    "skillAssessmentCompletionId" INTEGER NOT NULL,
    "certificate_name" TEXT NOT NULL,
    "certificate_issuer" TEXT NOT NULL,
    "certificate_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("certificate_id")
);

-- CreateTable
CREATE TABLE "Company"."Company" (
    "company_id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_description" TEXT,
    "logo" TEXT,
    "company_city" TEXT,
    "company_province" TEXT,
    "cityId" INTEGER,
    "address_details" TEXT,
    "latitude" INTEGER,
    "longitude" INTEGER,
    "company_industry" "Company"."CompanyIndustry",
    "company_size" "Company"."CompanySize",

    CONSTRAINT "Company_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "Company"."Category" (
    "category_id" SERIAL NOT NULL,
    "jobPostId" INTEGER NOT NULL,
    "category_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "Company"."JobPost" (
    "job_id" SERIAL NOT NULL,
    "preSelectionTestId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "selection_text_active" BOOLEAN NOT NULL DEFAULT false,
    "job_title" TEXT NOT NULL,
    "salary_show" BOOLEAN NOT NULL,
    "salary_min" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "salary_max" DECIMAL(10,2) DEFAULT 0,
    "job_description" TEXT NOT NULL,
    "job_experience_min" INTEGER NOT NULL,
    "job_experience_max" INTEGER DEFAULT 0,
    "expired_date" TIMESTAMP(3) NOT NULL,
    "status" BOOLEAN NOT NULL,
    "job_type" "Company"."JobType" NOT NULL,
    "job_space" "Company"."JobSpace" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "Application"."Application" (
    "application_id" SERIAL NOT NULL,
    "jobHunterId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "resume" TEXT NOT NULL,
    "expected_salary" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "application_status" "Application"."ApplicationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("application_id")
);

-- CreateTable
CREATE TABLE "PreSelectionTest"."PreSelectionTest" (
    "test_id" SERIAL NOT NULL,
    "test_name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreSelectionTest_pkey" PRIMARY KEY ("test_id")
);

-- CreateTable
CREATE TABLE "PreSelectionTest"."TestQuestion" (
    "question_id" SERIAL NOT NULL,
    "testId" INTEGER NOT NULL,
    "question_number" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer_1" TEXT NOT NULL,
    "answer_2" TEXT NOT NULL,
    "answer_3" TEXT NOT NULL,
    "answer_4" TEXT NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "PreSelectionTest"."Interview" (
    "interview_id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "interview_date" TIMESTAMP(3) NOT NULL,
    "interview_time_start" TIMESTAMP(3) NOT NULL,
    "interview_time_end" TIMESTAMP(3) NOT NULL,
    "interview_descrption" TEXT NOT NULL,
    "interview_status" "PreSelectionTest"."InterviewStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("interview_id")
);

-- CreateTable
CREATE TABLE "PreSelectionTest"."ResultPreSelection" (
    "completion_id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "completion_score" INTEGER NOT NULL DEFAULT 0,
    "completion_date" TIMESTAMP(3) NOT NULL,
    "completion_status" "PreSelectionTest"."CompletionStatusPreSelectionTest" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultPreSelection_pkey" PRIMARY KEY ("completion_id")
);

-- CreateTable
CREATE TABLE "Location"."province" (
    "province_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "province_pkey" PRIMARY KEY ("province_id")
);

-- CreateTable
CREATE TABLE "Location"."city" (
    "city_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" INTEGER NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("city_id")
);

-- CreateTable
CREATE TABLE "Application"."_ApplicationToJobWishlist" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ApplicationToJobWishlist_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "BaseUsers_email_key" ON "BaseUsers"."BaseUsers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BaseUsers_google_id_key" ON "BaseUsers"."BaseUsers"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "JobHunter_userId_key" ON "JobHunter"."JobHunter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobHunter_email_key" ON "JobHunter"."JobHunter"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"."Company"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "province_province_id_key" ON "Location"."province"("province_id");

-- CreateIndex
CREATE UNIQUE INDEX "city_city_id_key" ON "Location"."city"("city_id");

-- CreateIndex
CREATE INDEX "_ApplicationToJobWishlist_B_index" ON "Application"."_ApplicationToJobWishlist"("B");

-- AddForeignKey
ALTER TABLE "JobHunter"."JobHunter" ADD CONSTRAINT "JobHunter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BaseUsers"."BaseUsers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."JobHunter" ADD CONSTRAINT "JobHunter_jobHunterSubscriptionId_fkey" FOREIGN KEY ("jobHunterSubscriptionId") REFERENCES "Subscription"."JobHunterSubscription"("job_hunter_subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."JobHunter" ADD CONSTRAINT "JobHunter_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Location"."city"("city_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Developer"."Developer" ADD CONSTRAINT "Developer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BaseUsers"."BaseUsers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."WorkExperience" ADD CONSTRAINT "WorkExperience_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."WorkExperience" ADD CONSTRAINT "WorkExperience_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"."Company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."Education" ADD CONSTRAINT "Education_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."JobWishlist" ADD CONSTRAINT "JobWishlist_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."JobWishlist" ADD CONSTRAINT "JobWishlist_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "Company"."JobPost"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."JobReview" ADD CONSTRAINT "JobReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"."Company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."JobReview" ADD CONSTRAINT "JobReview_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobHunter"."CvGenerated" ADD CONSTRAINT "CvGenerated_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription"."JobHunterSubscription" ADD CONSTRAINT "JobHunterSubscription_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"."SubscriptionTable"("subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription"."Transaction" ADD CONSTRAINT "Transaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"."SubscriptionTable"("subscription_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription"."Transaction" ADD CONSTRAINT "Transaction_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription"."Payment" ADD CONSTRAINT "Payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Subscription"."Transaction"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssessment"."SkillAssessment" ADD CONSTRAINT "SkillAssessment_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"."Developer"("developer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssessment"."SkillAsessmentQuestion" ADD CONSTRAINT "SkillAsessmentQuestion_skillAssessmentId_fkey" FOREIGN KEY ("skillAssessmentId") REFERENCES "SkillAssessment"."SkillAssessment"("skill_assessment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssessment"."SkillAsessmentCompletion" ADD CONSTRAINT "SkillAsessmentCompletion_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssessment"."SkillAsessmentCompletion" ADD CONSTRAINT "SkillAsessmentCompletion_skillAssessmentId_fkey" FOREIGN KEY ("skillAssessmentId") REFERENCES "SkillAssessment"."SkillAssessment"("skill_assessment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillAssessment"."Certificate" ADD CONSTRAINT "Certificate_skillAssessmentCompletionId_fkey" FOREIGN KEY ("skillAssessmentCompletionId") REFERENCES "SkillAssessment"."SkillAsessmentCompletion"("skill_assessment_completion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company"."Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BaseUsers"."BaseUsers"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company"."Company" ADD CONSTRAINT "Company_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "Location"."city"("city_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company"."JobPost" ADD CONSTRAINT "JobPost_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"."Company"("company_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company"."JobPost" ADD CONSTRAINT "JobPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Company"."Category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company"."JobPost" ADD CONSTRAINT "JobPost_preSelectionTestId_fkey" FOREIGN KEY ("preSelectionTestId") REFERENCES "PreSelectionTest"."PreSelectionTest"("test_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application"."Application" ADD CONSTRAINT "Application_jobHunterId_fkey" FOREIGN KEY ("jobHunterId") REFERENCES "JobHunter"."JobHunter"("job_hunter_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application"."Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Company"."JobPost"("job_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreSelectionTest"."TestQuestion" ADD CONSTRAINT "TestQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "PreSelectionTest"."PreSelectionTest"("test_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreSelectionTest"."Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"."Application"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreSelectionTest"."ResultPreSelection" ADD CONSTRAINT "ResultPreSelection_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"."Application"("application_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location"."city" ADD CONSTRAINT "city_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Location"."province"("province_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application"."_ApplicationToJobWishlist" ADD CONSTRAINT "_ApplicationToJobWishlist_A_fkey" FOREIGN KEY ("A") REFERENCES "Application"."Application"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application"."_ApplicationToJobWishlist" ADD CONSTRAINT "_ApplicationToJobWishlist_B_fkey" FOREIGN KEY ("B") REFERENCES "JobHunter"."JobWishlist"("wishlist_id") ON DELETE CASCADE ON UPDATE CASCADE;
