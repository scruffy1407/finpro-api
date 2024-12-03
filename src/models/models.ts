export interface Auth {
    email: string;
    name: string;
    password: string;
    user_role: "jobhunter" | "company";
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    oauth_token: string;
    user: Auth
}

export interface ResetPassword{
    email: string;
}
