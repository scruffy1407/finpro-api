import { Request, Response } from "express";
import { PrismaClient, RegisterBy, RoleType } from "@prisma/client";
import { AuthUtils } from "../utils/auth.utils";
import { GoogleProfile } from "../models/models";
import passport from "passport";

const prisma = new PrismaClient();

export class OauthController {
  private authUtils: AuthUtils;
  constructor() {
    this.authUtils = new AuthUtils();
    this.googleCallback = this.googleCallback.bind(this);
  }

  googleJobhunter(req: Request, res: Response) {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: "jobhunter",
    })(req, res);
  }

  googleCompany(req: Request, res: Response) {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: "company",
    })(req, res);
  }

  async googleCallback(req: Request, res: Response): Promise<void> {
    const roleFromState = req.query.state as string;
    const profile = req.user as GoogleProfile;

    if (!profile || !profile.id) {
      console.error("User profile is missing or incomplete.");
      res.status(400).json({ error: "OAuth profile not found." });
      return;
    }

    try {
      let user = await prisma.baseUsers.findUnique({
        where: {
          google_id: profile.id,
        },
      });
      const role_type =
        roleFromState === "company" ? RoleType.company : RoleType.jobhunter;
      if (!user) {
        const email = profile.emails[0].value;
        const newUserData = {
          email: email,
          google_id: profile.id,
          verified: true,
          register_by: RegisterBy.google,
          role_type: role_type,
          password: "",
        };

        user = await prisma.baseUsers.create({
          data: newUserData,
        });

        const name = profile.name
          ? `${profile.name.givenName} ${profile.name.familyName}`
          : "Default Name";
        const photo = profile.photos?.[0]?.value;

        if (role_type === RoleType.jobhunter) {
          await prisma.jobHunter.create({
            data: {
              userId: user.user_id,
              name: name,
              email: email,
              photo: photo,
              password: "",
              jobHunterSubscriptionId: 1,
            },
          });
        }

        if (role_type === RoleType.company) {
          await prisma.company.create({
            data: {
              userId: user.user_id,
              company_name: name,
              logo: photo,
            },
          });
        }
      }

      const { accessToken, refreshToken } =
        await this.authUtils.generateLoginToken(user.user_id, role_type);

      await prisma.baseUsers.update({
        where: { google_id: profile.id },
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });

      res.redirect("http://localhost:3000");
    } catch (error) {
      console.error("Error handling callback:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
}
