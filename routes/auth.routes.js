import { Router } from "express";
import { getLoginPage, getRegistrationPage, postLogin, postRegistrationPage, getProfilePage, logoutUser, getEmailVerificationPage, resendVerificationEmail, verifyEmailToken } from "../controller/auth.controller.js";

const router = Router();

router.route("/registration").get(getRegistrationPage).post(postRegistrationPage);
router.route("/login").get(getLoginPage).post(postLogin)
router.route("/me").get(getProfilePage);
router.route("/logout").get(logoutUser);
router.route("/verify-email").get(getEmailVerificationPage);
router.route("/resend-verification-email").get(resendVerificationEmail)
router.route("/verify-email-token").get(verifyEmailToken);

export const authRoutes = router;