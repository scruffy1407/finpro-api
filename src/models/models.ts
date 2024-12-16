import {
  CompanyIndustry,
  CompanySize,
  Gender,
  EducationDegree,
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
  user_id: number;
  role_type: string;
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
}

export interface Application {
  jobHunterId: number;
  jobId: number;
  resume: string;
  expected_salary: Decimal;
  application_status: ApplicationStatus;
}
