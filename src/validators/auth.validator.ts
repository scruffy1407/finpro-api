import { z as validate } from "zod";

// Register Validation Schema
export const registerSchema = validate.object({
  name: validate.string().min(4, "Name is required"),
  email: validate.string().email("Invalid email address"),
  password: validate
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[a-z]/, {
      message: "Password must include at least one lowercase letter",
    })
    .regex(/[A-Z]/, {
      message: "Password must include at least one uppercase letter",
    })
    .regex(/\d/, { message: "Password must include at least one number" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must include at least one special character",
    }),
});

// Login Validation Schema
export const loginSchema = validate.object({
  email: validate.string().email("Invalid email address"),
  password: validate
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[a-z]/, {
      message: "Password must include at least one lowercase letter",
    })
    .regex(/[A-Z]/, {
      message: "Password must include at least one uppercase letter",
    })
    .regex(/\d/, { message: "Password must include at least one number" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must include at least one special character",
    }),
});

export const resetPasswordSchema = validate.object({
  password: validate
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .regex(/[a-z]/, {
      message: "Password must include at least one lowercase letter",
    })
    .regex(/[A-Z]/, {
      message: "Password must include at least one uppercase letter",
    })
    .regex(/\d/, { message: "Password must include at least one number" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Password must include at least one special character",
    }),
});

export function validatePassword(password: string) {
  const regexPatterns = [
    /[a-z]/, // At least one lowercase letter
    /[A-Z]/, // At least one uppercase letter
    /\d/, // At least one number
    /[!@#$%^&*(),.?":{}|<>]/, // At least one special character
  ];

  for (const pattern of regexPatterns) {
    if (!pattern.test(password)) {
      return false;
    }
  }

  return true;
}
