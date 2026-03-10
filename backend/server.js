import express from "express";
import {shortenerUrls} from "../routes/shortener.routes.js";
import { env } from "../config/env.js";
// import { connectDB } from "../config/db-client.js";

const app = express();

app.use(express.static("frontend"));
app.use(express.urlencoded({ extended: true }));
app.use(shortenerUrls);

app.set('view engine', 'ejs');
try {
  // await connectDB();
  app.listen(env.PORT, () => {
    console.log("🔥 Listening on port :", env.PORT);
  });
} catch (error) {
    console.error(error);
}
