import { Router } from "express";
import { getLoginPage, getRegistrationPage, postLogin, postRegistrationPage, getProfilePage, logoutUser, getEmailVerificationPage, resendVerificationEmail, verifyEmailToken, getEditProfilePage, postUpdatedProfilePage, getChangePassPage, postUpdatedPassword, getPageToEnterEmailForResetPass, sendVerifyEmailForResetPass, getResetPasswordPage, postResetPassword } from "../controller/auth.controller.js";

const router = Router();

router.route("/registration").get(getRegistrationPage).post(postRegistrationPage);
router.route("/login").get(getLoginPage).post(postLogin)
router.route("/me").get(getProfilePage);
router.route("/logout").get(logoutUser);
router.route("/verify-email").get(getEmailVerificationPage);
router.route("/resend-verification-email").get(resendVerificationEmail)
router.route("/verify-email-token").get(verifyEmailToken);
router.route("/edit-profile").get(getEditProfilePage).post(postUpdatedProfilePage);
router.route("/change-password").get(getChangePassPage).post(postUpdatedPassword);
router.route("/reset-password").get(getPageToEnterEmailForResetPass).post(sendVerifyEmailForResetPass);
router.route("/reset-password/:token").get(getResetPasswordPage).post(postResetPassword)

export const authRoutes = router;