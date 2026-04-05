import crypto from "crypto";
import { loadLinks, saveLinks, getLinkByShortCode, findLinkById, updateUrlById, deleteUrlById } from "../services/shortener.services.js";
import { shortnerSearchParamSchema, urlSchema } from "../validators/url-validators.js";
import { fetchUserById } from "../services/auth.services.js";

export const postUrlShortener = async (req, res) => {
  try {
    if(!req.user) return res.redirect("/login");
    
    const {data, error} = urlSchema.safeParse(req.body);

    if(error) {
      const err = error.issues[0].message;
      req.flash("errors", err);
      return res.redirect("/");
    }

    const { enterurl, shorturl } = data;

    const finalShortUrl = shorturl || crypto.randomBytes(5).toString("hex");

     // check if shortcode already exists
    const existingLink = await getLinkByShortCode(finalShortUrl);

    if (existingLink) {
      req.flash("errors", "Shortcode already exists. Please choose another!")
      return res.redirect("/");
    }
   
    await saveLinks({url : enterurl, shortCode : finalShortUrl, userId : req.user.id})

    return res.redirect("/");
  } catch (error) {
    console.log(`Error during posting : ${error.message}`);
    return res.status(400).send("Unable to run post method in server");
  }
};

export const getShortnerPage = async (req, res) => {
  try {
    if(!req.user) return res.redirect("/login");

    const searchParams = shortnerSearchParamSchema.parse(req.query);
    // const links = await loadLinks(req.user.id);

    const {shortLinks, totalCount} = await loadLinks({
      userId: req.user.id,
      limit: 10,
      offset: (searchParams.page - 1) * 10
    });

    const user = await fetchUserById(req.user.id);

    return res.render("index", {
      links,
      host: req.headers.host,
      errors : req.flash("errors"),
      userId : user.id,
      name : user.name
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

export const getEditPage = async (req, res) => {
  const { id } = req.params;
  const link = await findLinkById(id);
  return res.render("edit", {
    link,
    id,
    errors: req.flash("errors")
  })
}

export const postUpdatedUrl = async (req, res) => {
  const { id } = req.params;
  const {url, shortCode} = req.body;

  const existingLink = await getLinkByShortCode(shortCode);

  if (existingLink) {
    req.flash("errors", "Shortcode already exists. Please choose another!")
    return res.redirect(`/edit/${id}`);
  }

  await updateUrlById({id, url, shortCode});

  return res.redirect("/");
}

export const deleteUrl = async (req, res) => {
  const {id} = req.params;
  await deleteUrlById(id);
  return res.redirect("/");
}