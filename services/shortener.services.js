import { db } from "../config/db.js";
import { shortLinkTable } from "../drizzle/schema.js";
import { count, desc, eq } from "drizzle-orm";

export const loadLinks = async ({userId, limit=10, offset=0}) => {
    const condition = eq(shortLinkTable.userId, userId);
    const shortLinks = await db.select().from(shortLinkTable).where(condition).orderBy(desc(shortLinkTable.createdAt)).limit(limit).offset(offset);

    const [{totalCount}] = await db.select({totalCount: count()}).from(shortLinkTable).where(condition);

    return {shortLinks, totalCount};
}

export const getLinkByShortCode = async (shortcode) => {
    const [shortLink] = await db.select().from(shortLinkTable).where(eq(shortLinkTable.shortCode, shortcode));
    return shortLink;
}

export const saveLinks = async ({url, shortCode, userId, summary}) => {
    const newShortLink = await db.insert(shortLinkTable).values({url, shortCode, userId, summary});
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
