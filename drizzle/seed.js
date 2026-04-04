import { reset, seed } from "drizzle-seed";
import * as schemas from "./schema.js";
import {db} from "../config/db.js";

// await reset(db, schemas);
// await seed(db, {

// })

const USER_ID=1;
await reset(db, {shortLinkTable : schemas.shortLinkTable});
await seed(db, {shortLinkTable : schemas.shortLinkTable}, {count:100}).refine((f) => ({
    shortLinkTable: {
        columns: {
            userId: f.default({defaultValue: USER_ID}),
            url: f.default({defaultValue: "https://www.codewithharry.com/"})
        }
    }
}));
process.exit(0);