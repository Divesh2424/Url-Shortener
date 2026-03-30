import { Router } from "express";
import { getLoginPage, getRegistrationPage, postLogin, postRegistrationPage, getProfilePage, logoutUser, getEmailVerificationPage, resendVerificationEmail, verifyEmailToken, getEditProfilePage, postUpdatedProfilePage, getChangePassPage, postUpdatedPassword, getPageToEnterEmailForResetPass, sendVerifyEmailForResetPass, getResetPasswordPage, postResetPassword, getGoogleLoginPage, getGoogleLoginCallback, getGithubLoginPage, getGithubLoginCallback } from "../controller/auth.controller.js";

const router = Router();

router.route("/registration").get(getRegistrationPage).post(postRegistrationPage);
router.route("/login").get(getLoginPage).post(postLogin)
router.route("/me").get(getProfilePage);
router.route("/verify-email").get(getEmailVerificationPage);
router.route("/resend-verification-email").get(resendVerificationEmail)
router.route("/verify-email-token").get(verifyEmailToken);
router.route("/edit-profile").get(getEditProfilePage).post(postUpdatedProfilePage);
router.route("/change-password").get(getChangePassPage).post(postUpdatedPassword);
router.route("/reset-password").get(getPageToEnterEmailForResetPass).post(sendVerifyEmailForResetPass);
router.route("/reset-password/:token").get(getResetPasswordPage).post(postResetPassword)
router.route("/google").get(getGoogleLoginPage);
router.route("/google/callback").get(getGoogleLoginCallback);
router.route("/github").get(getGithubLoginPage);
router.route("/github/callback").get(getGithubLoginCallback);
router.route("/logout").get(logoutUser);

export const authRoutes = router;