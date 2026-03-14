//if we will use prisma 

// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export const loadLinks = async () => {
//     const allLinks = await prisma.shortLink.findMany();
//     return allLinks;
// }

// export const getLinkByShortCode = async (shortcode) => {
//     const shortLink = await prisma.shortLink.findUnique({
//         where : {shortCode : shortcode}
//     })
//     return shortLink;
// }

// export const saveLinks = async ({url, shortCode}) => {
//     const newShortLink = await prisma.shortLink.create({
//         data : { shortCode, url}
//     })
//     return newShortLink;
// }

//if we will use drizzle

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
