import { db } from "../config/db.js";
import { shortLinkTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

export const loadLinks = async (userId) => {
    const allLinks = await db.select().from(shortLinkTable).where(eq(shortLinkTable.userId, userId));
    return allLinks;
}

export const getLinkByShortCode = async (shortcode) => {
    const [shortLink] = await db.select().from(shortLinkTable).where(eq(shortLinkTable.shortCode, shortcode));
    return shortLink;
}

export const saveLinks = async ({url, shortCode, userId}) => {
    const newShortLink = await db.insert(shortLinkTable).values({url, shortCode, userId});
    return newShortLink;
}

export const findLinkById = async (id) => {
    const [link] = await db.select().from(shortLinkTable).where(eq(shortLinkTable.id, id));
    return link;
}

export const updateUrlById = async ({id, url, shortCode}) => {
    return await db.update(shortLinkTable).set({url, shortCode}).where(eq(shortLinkTable.id, id));
}

export const deleteUrlById = async (id) => {
    return await db.delete(shortLinkTable).where(eq(shortLinkTable.id, id));
}
