import { Router } from "express";
import { getLoginPage, getRegistrationPage, postLogin, postRegistrationPage } from "../controller/auth.controller.js";

const router = Router();

// router.get("/login", getLoginPage);
router.route("/registration").get(getRegistrationPage).post(postRegistrationPage);
router.route("/login").get(getLoginPage).post(postLogin)

export const authRoutes = router;