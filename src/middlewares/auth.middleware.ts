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

      // Typecast decoded token to your custom interface
      const user = decoded as JwtPayload;
      console.log("Decoded token user_id:", user.user_id);
      console.log("Decoded token role_type:", user.role_type);
      console.log("Decoded token company_id:", user.companyId);
      console.log("Decoded token verified:", user.verified);
      user; // Attach the strongly-typed user object
      console.log(user, "INI DECODED USER DAPET KGK 1");
//       (req as any).user = user; // Attach the strongly-typed user object
      console.log("Decoded token 2 :", decoded);
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
      next(); // Continue to next middleware
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

  //
  // authorizeUserId(): (req: Request, res: Response, next: NextFunction) => void {
  //   return (req: Request, res: Response, next: NextFunction): void => {
  //     const userId = (req as any).user.id;
  //     const resourceId = req.params.userId || req.body.userId;
  //     if (String(userId) !== String(resourceId)) {
  //       res.status(403).send({
  //         message: "Forbidden: You can only access your own resources",
  //         status: res.statusCode,
  //       });
  //       return;
  //     }
  //     next(); // Continue to next middleware
  //   };
  // }
}
