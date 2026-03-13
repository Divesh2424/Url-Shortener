import crypto from "crypto";
import { loadLinks, saveLinks, getLinkByShortCode } from "../services/shortener.services.js";
// import { url } from "inspector";

export const postUrlShortener = async (req, res) => {
  try {
    const { enterurl, shorturl } = req.body;

    const finalShortUrl = shorturl || crypto.randomBytes(5).toString("hex");

     // check if shortcode already exists
    const existingLink = await getLinkByShortCode(finalShortUrl);

    if (existingLink) {
      return res.status(409).send("Short code already exists");
    }
   
    await saveLinks({url : enterurl, shortCode : finalShortUrl})

    return res.redirect("/");
  } catch (error) {
    console.log(`Error during posting : ${error.message}`);
    return res.status(400).send("Unable to run post method in server");
  }
};

export const getShortnerPage = async (req, res) => {
  try {
    const links = await loadLinks();

    // let isLoggedIn = req.headers.cookie;
    // isLoggedIn = Boolean(isLoggedIn?.split("=")[1]);
    // console.log(typeof isLoggedIn);

    let isLoggedIn = req.cookies.isLoggedIn;

    return res.render("index", {
      links,
      host: req.headers.host,
      isLoggedIn
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error");
  }
};

export const redirectToShortLink = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await getLinkByShortCode(shortCode);

    if (!link) {
      return res.status(404).send("Not Found");
    }

    return res.redirect(link.url);
  } catch (error) {
    console.log(error.message);
    return res.status(500).send("Internal Server Error");
  }
};
