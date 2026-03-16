import express from "express";
import { env } from "../config/env.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import requestIp from "request-ip";
import {shortenerUrls} from "../routes/shortener.routes.js";
import { authRoutes } from "../routes/auth.routes.js";
import { verifyAuthentication } from "../middlewares/verify-auth-middleware.js"

const app = express();

app.use(express.static("frontend"));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(session({
  secret: "my-secret",
  resave: true,
  saveUninitialized: false
}));
app.use(flash());
app.use(requestIp.mw());
app.use(verifyAuthentication);
app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
});
app.use(authRoutes);
app.use(shortenerUrls);

try {
  app.listen(env.PORT, () => {
    console.log("🔥 Listening on port :", env.PORT);
  });
} catch (error) {
    console.error(error);
}
