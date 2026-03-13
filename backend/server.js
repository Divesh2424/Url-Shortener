import express from "express";
import {shortenerUrls} from "../routes/shortener.routes.js";
import { authRoutes } from "../routes/auth.routes.js";
import { env } from "../config/env.js";
import cookieParser from "cookie-parser";
import { verifyAuthentication } from "../middlewares/verify-auth-middleware.js"

const app = express();

app.use(express.static("frontend"));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(verifyAuthentication);
app.use(authRoutes);
app.use(shortenerUrls);

try {
  app.listen(env.PORT, () => {
    console.log("🔥 Listening on port :", env.PORT);
  });
} catch (error) {
    console.error(error);
}
