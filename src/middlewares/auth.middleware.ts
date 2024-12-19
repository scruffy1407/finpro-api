import { Request, Response, NextFunction } from "express";
import environment from "dotenv";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../models/models";

environment.config();

export class AuthJwtMiddleware {
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
    
      (req as any).user = user; // Attach the strongly-typed user object
      console.log (user, "INI DECODED USER DAPET KGK 1")
      console.log("Decoded token 2 :", decoded);
      next();
    });
  }
  authorizeRole(
    roles: string
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!roles.includes((req as any).user.role_type)) {
        res.status(403).send({
          message: "Forbidden",
          status: res.statusCode,
        });
        return;
      }
      next(); // Continue to next middleware
    };
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
