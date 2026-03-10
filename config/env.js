import {z} from "zod";

export const env = z.object({
    PORT: z.coerce.number().default(3000),
    // MONGODB_URI: z.string(),
    // MONGODB_DB_NAME: z.string()
}).parse(process.env);