import { Router } from "express";
import { postUrlShortener, getShortnerPage, redirectToShortLink, getEditPage, postUpdatedUrl, deleteUrl } from "../controller/postUrl.js";

const router = Router();

router.route("/").get(getShortnerPage).post(postUrlShortener);
router.get("/:shortCode", redirectToShortLink);
router.route("/edit/:id").get(getEditPage).post(postUpdatedUrl);
router.route("/delete/:id").post(deleteUrl)

export const shortenerUrls = router;