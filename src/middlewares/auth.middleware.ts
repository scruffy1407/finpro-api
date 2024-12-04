import { Request, Response, NextFunction } from "express";
import environment from "dotenv";
import jwt from "jsonwebtoken";

environment.config();

// basically buat register & login bikin middleware penjagaan validasi input register & login

export class AuthenticateJwtMiddleware {
  authenticateJwt(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const JWT_SECRET = process.env.JWT_SECRET as string;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is missing or invalid",
      });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        res.status(401).json({ success: false, message: "Invalid token" });
      } else {
        (req as any).user = user;
        next();
      }
    });
  }

  checkUserId(req: Request, res: Response, next: NextFunction): void {
    const userIdFromToken = (req as any).user.id;
    const userIdFromParams = parseInt(req.params.userId, 10);

    if (userIdFromToken !== userIdFromParams) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    next();
  }

  authorizeRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!roles.includes((req as any).user.role)) {
        res.status(403).json({ success: false, message: "Forbidden" });
        return;
      }
      next();
    };
  }
}
