import passport from "passport";
import { PrismaClient, BaseUsers } from "@prisma/client";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const prisma = new PrismaClient();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const CALLBACK_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google/callback`;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID as string,
      clientSecret: GOOGLE_CLIENT_SECRET as string,
      callbackURL: CALLBACK_URL as string,
      scope: ["email", "profile", "openid"],
      ...({ accessType: "offline", prompt: "consent" } as any),
    },
    async (accessToken, refreshToken, profile, done) => {
      return done(null, profile, { accessToken, refreshToken });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user: BaseUsers, done) => {
  done(null, user);
});
