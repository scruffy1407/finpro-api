import {
  CompanyIndustry,
  CompanySize,
  Gender,
  EducationDegree,
  JobSpace,
  JobType,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface Auth {
  email: string;
  name?: string;
  photo?: string | null;
  phone_number?: string | null;
  password: string;
  user_role: "jobhunter" | "company" | "developer";
  bearerToken?: string;
}

export interface UserId {
  user_id: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  oauth_token: string;
  user: Auth;
}

export interface ResetPassword {
  email: string;
  access_token: string;
  refresh_token: string;
  oauth_token: string;
  user: Auth;
}

export interface Result {
  success: boolean;
  message?: string;
  user?: Auth;
}

export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{
    value: string;
    verified: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
  provider: string;
  _raw: string;
  accessToken: string;
  refreshToken: string;
  _json: {
    sub: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
    email: string;
    email_verified: boolean;
  };
}

export interface JwtPayload {
  companyId?: string; // The company ID from the token
  company_id?: string;
  user_id: number;
  role_type: string;
  verified: boolean;
}

export interface CompanyInfoResp {
  email: string;
  company_id: number;
  company_logo: string;
  company_name: string;
  company_description: string;
  company_province: string;
  latitude: number;
  longitude: number;
  company_city: string;
  company_industry: string;
  company_size: string;
  address_detail: string;
}

export interface CompanyGeneralInfo {
  company_id: number;
  company_name: string;
  company_description: string;
  company_province: string;
  company_city: string;
  company_industry: CompanyIndustry;
  company_size: CompanySize;
}

export interface JobHunterGeneralInfo {
  photo?: string;
  jobHunterId: number;
  name: string;
  dob?: Date;
  gender?: Gender;
  locationCity?: string;
  locationProvince?: string;
  cityId?: number;
  provinceId?: number;
  expectedSalary?: number;
  summary: string;
}

export interface WorkingExperience {
  jobHunterId: number;
  companyId: number;
  jobTitle: string;
  jobDescription: string;
}

export interface EducationData {
  jobHunterId: number;
  education_degree: EducationDegree;
  education_name: string;
  education_description: string;
  cumulative_gpa: number;
  graduation_date: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface UpdateImage {
  id: number; // Can be job hunter ID or Company ID
  image: string;
}

export enum ApplicationStatus {
  FAILED = "failed",
  ON_REVIEW = "onreview",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  waitingSubmission = "waitingSubmission"
}

export interface Application {
  jobHunterId: number;
  jobId: number;
  resume: string;
  expected_salary: Decimal;
  application_status: ApplicationStatus;
}

export interface JobPost {
  job_title: string;
  companyId?: number;
  preSelectionTestId?: number;
  catergoryId?: number;
  salary_show: boolean;
  salary_min: number;
  salary_max: number;
  job_description: string;
  job_experience_min: number;
  job_experience_max: number;
  expired_date: Date;
  status: boolean;
  job_type: "Full-Time" | "Freelance" | "Internship" | JobType; // Enum-like values
  job_space: "Remote Working" | "On Office" | "Hybrid" | JobSpace; // Enum-like values
}

export interface JobPostWithRelatedJobs {
  job_id: number;
  job_title: string;
  salary_min: string;
  salary_max: string;
  job_description: string;
  job_experience_min: number;
  job_experience_max: number;
  expired_date: string;
  status: boolean;
  job_type: string;
  job_space: string;
  created_at: string;
  updated_at: string;
  company: {
    company_id: number;
    company_name: string;
    company_description: string | null;
    logo: string | null;
    company_city: string | null;
    company_province: string | null;
    address_details: string | null;
    company_industry: string | null;
    company_size: string | null;
    review: Array<any>;
  };
  category: {
    category_name: string;
  };
  preSelectionTest: {
    test_name: string;
  };
  // Add relatedJobs to the type
  relatedJobs?: Array<{
    job_id: number;
    job_title: string;
    salary_min: string;
    salary_max: string;
    created_at: string;
    job_type: string;
    company: {
      logo: string | null;
      company_name: string;
      company_city: string | null;
    };
  }>;
}

export enum InterviewStatus {
  scheduled = "scheduled",
  cancelled = "cancelled",
  completed = "completed",
}

export interface Interview {
  interviewId?: number;
  applicationId: number;
  interviewDate: Date;
  interviewTimeStart: Date;
  interviewTimeEnd: Date;
  interviewDescrption: string;
  interviewUrl?: string;
  interviewStatus?: InterviewStatus;
}

export interface InterviewEmail {
  email: string;
  name: string;
  companyName: string;
  jobTitle: string;
  interviewdDate: string;
  interviewTimeStart: string;
  interviewTimeEnd: string;
  invitatationLink: string;
}

export interface UpdateStatusInterview {
  interviewId: number;
  applicationId: number;
  interviewStatus: InterviewStatus;
}

export interface reviewResponse {
  reviewId: number;
  companyId: number;
  jobunterId: number;
  reviewTitle: string;
  reviewDescription: string;
  culturalRating: number;
  workLifeBalanceRating: number;
  facilityRating: number;
  careerPathRating: number;
}

export interface ReviewData {
  reviewId?: number;
  workExperienceId: number;
  reviewTitle: string;
  reviewDescription: string;
  culturalRating: number;
  workLifeBalanceRating: number;
  facilityRating: number;
  careerPathRating: number;
}

export interface companyDetailResponse {
  companyId: number;
  email: string;
  logo: string;
  companyName: string;
  companyDescription: string;
  companyCity: string;
  companyProvince: string;
  addressDetail: string;
  companyIndustry: string;
  companySize: string;
  listJob: JobPost[];
  listReview: reviewResponse[];
}
