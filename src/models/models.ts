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

export interface JobPost {
  job_title: string;
  companyId ?: number;
  preSelectionTestId ?: number,
  catergoryId ?: number,
  salary_show: boolean;
  salary_min: number;
  salary_max: number;
  job_description: string;
  job_experience_min: number;
  job_experience_max: number;
  expired_date: Date;
  status: boolean;
  job_type: "Full-Time" | "Freelance" | "Internship";  // Enum-like values
  job_space: "Remote Working" | "On Office" | "Hybrid";  // Enum-like values
}

export interface DecodedToken {
  companyId: string;  // The company ID from the token
  user_id: number;    // Assuming user_id exists
  role_type: string;   // Assuming role_type exists
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

