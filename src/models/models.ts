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