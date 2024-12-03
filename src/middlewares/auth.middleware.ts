import { Request, Response, NextFunction } from "express";
import environment from "dotenv";
import jwt from "jsonwebtoken";
import { handleError } from "../utils/responseUtil";

environment.config();

export class AuthenticateJwtMiddleware {
  authenticateJwt(req: Request, res: Response, next: NextFunction): any {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const JWT_SECRET = process.env.JWT_SECRET as string;

    if (!token) {
      return handleError(res, 401, "Access token is missing or invalid");
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return handleError(res, 401, "Invalid token");
      } else {
        (req as any).user = user;
        next();
      }
    });
  }

  checkUserId(req: Request, res: Response, next: NextFunction): any {
    const userIdFromToken = (req as any).user.id;
    const userIdFromParams = parseInt(req.params.userId, 10);

    if (userIdFromToken !== userIdFromParams) {
      return handleError(res, 403, "Forbidden");
    }

    next();
  }

  authorizeRole(roles: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!roles.includes((req as any).user.role)) {
        return handleError(res, 403, "Forbidden");
      }
      next();
    };
  }
}
