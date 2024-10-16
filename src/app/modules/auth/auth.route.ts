import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { PatientValidation } from "../patient/patient.validation";
import { AuthController } from "./auth.controller";
import { AuthValidations } from "./authValidation";
import auth from "../../middlewares/auth";

const router = Router();
router.get("/refresh-token", AuthController.refreshToken);
router.post(
  "/sign-up",
  validateRequest(PatientValidation.createPatient),
  AuthController.createPatient,
);
router.post("/sign-in", validateRequest(AuthValidations.signInValidation), AuthController.signIn);
router.patch(
  "/change-password",
  auth(),
  validateRequest(AuthValidations.changePasswordValidation),
  AuthController.changePassword,
);
router.post(
  "/forget-password",
  validateRequest(AuthValidations.forgetPasswordValidation),
  AuthController.forgetPassword,
);
router.post(
  "/reset-password",
  validateRequest(AuthValidations.resetPasswordValidation),
  AuthController.resetPassword,
);
router.post(
  "/verify-account",
  validateRequest(AuthValidations.optValidation),
  AuthController.verifyAccount,
);
router.post(
  "/resend-otp",
  validateRequest(AuthValidations.resendOtpValidation),
  AuthController.resendOtp,
);
export const AuthRoutes = router;
