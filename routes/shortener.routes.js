import { Router } from "express";
import { postUrlShortener, getShortnerPage, redirectToShortLink } from "../controller/postUrl.js";

const router = Router();

//get request
router.get("/", getShortnerPage);

//post request route 
router.post("/", postUrlShortener);

router.get("/:shortCode", redirectToShortLink);

//default export
// export default router;

//named export(Recommended)
export const shortenerUrls = router;