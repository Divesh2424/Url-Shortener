import { Router } from "express";
import multer from "multer";
import path from "path";
import { getLoginPage, getRegistrationPage, postLogin, postRegistrationPage, getProfilePage, logoutUser, getEmailVerificationPage, resendVerificationEmail, verifyEmailToken, getEditProfilePage, postUpdatedProfilePage, getChangePassPage, postUpdatedPassword, getPageToEnterEmailForResetPass, sendVerifyEmailForResetPass, getResetPasswordPage, postResetPassword, getGoogleLoginPage, getGoogleLoginCallback, getGithubLoginPage, getGithubLoginCallback, getSetPasswordPage, postSetPassword } from "../controller/auth.controller.js";
import { db } from "../config/db.js";
import { shortLinkTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

router.route("/registration").get(getRegistrationPage).post(postRegistrationPage);
router.route("/login").get(getLoginPage).post(postLogin)
router.route("/me").get(getProfilePage);
router.route("/verify-email").get(getEmailVerificationPage);
router.route("/resend-verification-email").get(resendVerificationEmail)
router.route("/verify-email-token").get(verifyEmailToken);

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "frontend/uploads/avatars");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}_${Math.floor(10000000 + Math.random() * 90000000)}${ext}`);
    }
});

const avatarFileFilter = (req, file, cb) => {
    if(file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
}

const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: avatarFileFilter,
    limits: {fileSize: 5*1024*1024} //5mb
})

router.route("/edit-profile").get(getEditProfilePage).post(avatarUpload.single('avatar'), postUpdatedProfilePage);

router.route("/change-password").get(getChangePassPage).post(postUpdatedPassword);
router.route("/reset-password").get(getPageToEnterEmailForResetPass).post(sendVerifyEmailForResetPass);
router.route("/reset-password/:token").get(getResetPasswordPage).post(postResetPassword)
router.route("/google").get(getGoogleLoginPage);
router.route("/google/callback").get(getGoogleLoginCallback);
router.route("/github").get(getGithubLoginPage);
router.route("/github/callback").get(getGithubLoginCallback);
router.route("/set-password").get(getSetPasswordPage).post(postSetPassword);
router.get("/summary/:id", async (req, res) => {
  const link = await db
    .select()
    .from(shortLinkTable)
    .where(eq(shortLinkTable.id, req.params.id));

  res.json({ summary: link[0].summary });
});
router.route("/logout").get(logoutUser);

export const authRoutes = router;