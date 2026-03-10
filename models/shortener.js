// // import { env } from "../config/env.js";
// // import { dbClient } from "../config/db-client.js"
// // import { db } from "../config/db-client.js";

// // // const db = dbClient.db(env.MONGODB_DB_NAME);
// // const shortenerCollection = db.collection('shorteners')

// export const loadLinks = async () => {
// //   return shortenerCollection.find().toArray();
//     const [rows] = await db.execute(`SELECT * FROM shortLink`);
//     // console.log("data :" ,rows)
//     return rows;
// }

// export const saveLinks = async (link) => {
// //   return shortenerCollection.insertOne({link});
//     return await db.execute(`INSERT INTO shortLink(shortCode, url) VALUES (?,?)`, [link])
// }

// export const getLinkByShortCode = async (shortcode) => {

// //   return await shortenerCollection.findOne({
// //     "link.shorturl": shortcode
// //   });
//     return await db.execute(`SELECT * FROM shortLink WHERE shortCode = ?`,[shortcode])

// }