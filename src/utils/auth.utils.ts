import environment from "dotenv";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../models/models";

environment.config();
const JWT_SECRET = process.env.JWT_SECRET as string;

export class AuthUtils {
  async generateLoginToken(
    user_id: number,
    role_type: string,
    verified: boolean,
    company_id?: number,
  ) {
    const accessToken = await this.generateAccessToken(
      user_id,
      role_type,
      verified,
      company_id,
    );

    const refreshToken = jwt.sign(
      {
        user_id: user_id,
        role_type: role_type,
        company_id: company_id,
        verified: verified,
      },
      JWT_SECRET,
      {
        expiresIn: "3d",
      },
    );
    return { accessToken, refreshToken };
  }

  async decodeToken(token: string): Promise<JwtPayload | null> {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  async generateAccessToken(
    user_id: number,
    role_type: string,
    verified: boolean,
    company_id?: number,
  ) {
    const accessToken = jwt.sign(
      {
        user_id: user_id,
        role_type: role_type,
        company_id: company_id,
        verified: verified,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );
    return accessToken;
  }
  //
  // async getAuthenticatedUser(req: Request) {
  //   const accessToken = req.headers.authorization?.split(" ")[1];
  //   if (!accessToken) {
  //     throw new Error("Unauthorized");
  //   }
  //
  //   const decodedToken = await this.decodeToken(accessToken);
  //   return decodedToken;
  // }

  async generateResetToken(email: string) {
    const resetToken = jwt.sign(
      {
        email: email,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );
    return resetToken;
  }
}
