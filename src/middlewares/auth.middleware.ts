import { Request, Response, NextFunction } from "express";
import environment from "dotenv";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../models/models";
import { AuthUtils } from "../utils/auth.utils";

environment.config();

export class AuthJwtMiddleware {
  private authUtils: AuthUtils;

  constructor() {
    this.authUtils = new AuthUtils();
  }

  authenticateJwt(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const JWT_SECRET = process.env.JWT_SECRET as string;
    if (!token) {
      res.status(401).send({
        message: "Access token is missing or invalid",
        status: res.statusCode,
      });
      return;
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Invalid token",
          status: res.statusCode,
        });
      }
      const user = decoded as JwtPayload;
      user;
      next();
    });
  }
  authorizeRole(
    roles: string,
  ): (req: Request, res: Response, next: NextFunction) => void {
    return async (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(" ")[1] as string;
      const decodedToken = await this.authUtils.decodeToken(token as string);

      if (!roles.includes(decodedToken?.role_type as string)) {
        res.status(403).send({
          message: "Forbidden",
          status: res.statusCode,
        });
        return;
      }
      next();
    };
  }

  async authorizeVerifyEmail(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else if (!decodedToken.verified) {
      res.status(404).send("Email of the user is not verified yet");
    } else {
      next();
    }
  }
}
