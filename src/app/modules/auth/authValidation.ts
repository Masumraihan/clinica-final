import { z } from "zod";

const signInValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email address" }),
    password: z.string({ required_error: "Password is required" }),
    fcmToken: z.string().optional(),
  }),
});
const refreshTokenValidation = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: "Refresh token is required!",
    }),
  }),
});

const changePasswordValidation = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: "Old password is required" }),
    newPassword: z.string({ required_error: "New password is required" }),
  }),
});

const forgetPasswordValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email address" }),
  }),
});

const optValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email address" }),
    otp: z.number({ required_error: "OTP is required" }),
  }),
});

const resendOtpValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Invalid email address" }),
  }),
});

const resetPasswordValidation = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email({
      message: "Invalid email address",
    }),
    password: z.string({ required_error: "Password is required" }),
  }),
});

export const AuthValidations = {
  signInValidation,
  refreshTokenValidation,
  forgetPasswordValidation,
  optValidation,
  resendOtpValidation,
  changePasswordValidation,
  resetPasswordValidation,
};
