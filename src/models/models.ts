import { CompanyIndustry, CompanySize } from "@prisma/client";

export interface Auth {
  email: string;
  name?: string;
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
  user_role: string;
}

// company_name        String
// company_description String?
//     logo                String?
//         company_city        String?
//             company_province    String?
//                 address_details     String?
//                     company_industry    CompanyIndustry?
//                         company_size        CompanySize?

export interface CompanyInfoResp {
  email: string;
  company_id: number;
  company_logo: string;
  company_name: string;
  company_description: string;
  company_province: string;
  company_city: string;
  company_industry: string;
  company_size: string;
  address_detail: string;
}

export interface companyUpdate {
  company_id: number;
  company_logo: string;
  company_name: string;
  company_description: string;
  company_province: string;
  company_city: string;
  company_industry: CompanyIndustry;
  company_size: CompanySize;
}
