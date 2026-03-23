import mjml2html from "mjml";
import ejs from "ejs";
import fs from "fs/promises";
import path from "path";

export const getHTMLFromMjmlTemplate = async (template, data) => {
    const mjmlTemplate = await fs.readFile(path.join(import.meta.dirname, "..", "emails", `${template}.mjml`), "utf-8");

    const filledTemplate = ejs.render(mjmlTemplate, data);

    return mjml2html(filledTemplate).html;
}