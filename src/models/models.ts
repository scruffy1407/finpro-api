export interface Auth {
    email: string;
    name?: string;
    password: string;
    user_role: "jobhunter" | "company" | "developer";
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    oauth_token: string;
    user: Auth
}

export interface Result {
    success: boolean;
    message?: string;
    user?: Auth;
  }