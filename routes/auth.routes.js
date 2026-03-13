import { Router } from "express";
import { getLoginPage, getRegistrationPage, postLogin, postRegistrationPage, getProfilePage, logoutUser } from "../controller/auth.controller.js";

const router = Router();

router.route("/registration").get(getRegistrationPage).post(postRegistrationPage);
router.route("/login").get(getLoginPage).post(postLogin)
router.route("/me").get(getProfilePage);
router.route("/logout").get(logoutUser);

export const authRoutes = router;