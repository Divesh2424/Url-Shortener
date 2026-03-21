import { db } from "../config/db.js";
import { passwordResetTokenTable, sessionsTable, shortLinkTable, usersTable, verifyEmailTokenTable } from "../drizzle/schema.js";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendEmail } from "../lib/send-email.js";
import fs from "fs/promises";
import path from "path";
import mjml2html from "mjml";
import ejs from "ejs";

export const getUserByEmail = async (email) => {
    const [getUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return getUser;
}

export const saveData = async ({name, email, password}) => {
    const [savedData] = await db.insert(usersTable).values({ name, email, password }).$returningId();
    return savedData;
}

export const hashingPasswords = async (password) => {
    return await argon2.hash(password);
}

export const comparePasswords = async (password, hash) => {
    return await argon2.verify(hash, password)
}

export const createSession = async (userId, { ip, userAgent}) => {
    const [session] = await db.insert(sessionsTable).values({userId, ip, userAgent}).$returningId();
    return session;
}

export const createAccessToken = ({id, name, email, sessionId}) => {
    return jwt.sign({id, name, email, sessionId}, process.env.JWT_SECRET, {
        expiresIn: "15min"
    })
}

export const createRefreshToken = (sessionId) => {
    return jwt.sign({sessionId}, process.env.JWT_SECRET, {
        expiresIn: "7d"
    })
}

export const verifyJWT = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
}

export const findSessionById = async (sessionId) => {
    const [sessionDetails] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    return sessionDetails;
}

export const fetchUserById = async (userId) => {
    const [userDetails] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return userDetails;
}

export const refreshTokens = async (refreshToken) => {
    const decodedToken = verifyJWT(refreshToken);
    const currentSession = await findSessionById(decodedToken.sessionId);

    if(!currentSession || !currentSession.valid) {
        throw new Error('Invalid session');
    }

    const currentUser = await fetchUserById(currentSession.userId);

    if(!currentUser) throw new Error('Invalid User');

    const userInfo = {
        id : currentUser.id,
        name : currentUser.name, 
        email : currentUser.email, 
        isEmailValid : currentUser.isEmailValid,
        sessionId : currentSession.id
    }
    //regenerate tokens
    const newAccessToken = createAccessToken(userInfo);
    const newRefreshToken = createRefreshToken(currentSession.id);

    
    return {
        newAccessToken, newRefreshToken, user : userInfo
    };
}

export const clearUserSession = async (sessionId) => {
    return await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}

export const authenticateFunc = async ({req, res, user, name, email}) => {
    //to create a session and store it in db
      const session = await createSession(user.id, {
        ip : req.clientIp,
        userAgent : req.headers["user-agent"]
      });
    
      const accessToken = createAccessToken({
        id : user.id,
        name : user.name || name,
        email : user.email || email,
        isEmailValid : false,
        sessionId : session.id
      });
      
      const refreshToken = createRefreshToken(session.id);
    
      const baseConfig = {httpOnly : true, secure : true}
    
      res.cookie("access_token", accessToken, {
        ...baseConfig,
        maxAge: 15 * 60 * 1000 //15 minutes
      });
      res.cookie("refresh_token", refreshToken, {
        ...baseConfig,
        maxAge: 7 * 24 * 60 * 60 * 1000 //7 days
      });
}

export const getAllShortLinks = async (userId) => {
    const totalShortLinks = await db.select().from(shortLinkTable).where(eq(shortLinkTable.userId, userId));
    return totalShortLinks;
}

export const generateRandomToken = (digit = 8) => {
    const min = 10 ** (digit - 1);  //10000000
    const max = 10 ** digit; //100000000

    return crypto.randomInt(min, max).toString();
}

export const insertVerifyEmailTokenInDb = async ({ userId, token }) => {
    return db.transaction(async (tx) => {
        try {
            //delete expiry tokens
            await tx.delete(verifyEmailTokenTable).where(lt(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`));
            
            //delete any existing token for specific user
            await tx.delete(verifyEmailTokenTable).where(eq(verifyEmailTokenTable.userId, userId));
            
            //new token insert for the user
            await tx.insert(verifyEmailTokenTable).values({userId, token});
        } catch (error) {
            console.error("Failed to insert Verification Token:", error);
            throw new Error("Unable to create verification token");
        }
    })
}

export const createVerifyEmailLink = async ({email, token}) => {
    const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);
    url.searchParams.append('token', token);
    url.searchParams.append('email', email);

    return url.toString();
}

export const findVerificationEmailToken = async ({token, email}) => {
    return await db.select({
        userId : usersTable.id,
        email : usersTable.email,
        token : verifyEmailTokenTable.token,
        expiresAt : verifyEmailTokenTable.expiresAt
    }).from(verifyEmailTokenTable)
    .where(
        and(
            eq(verifyEmailTokenTable.token, token),
            eq(usersTable.email, email),
            gte(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`)
        )
    )
    .innerJoin(usersTable, eq(verifyEmailTokenTable.userId, usersTable.id))
}

export const verifyUserEmailAndUpdate = async (email) => {
    return await db.update(usersTable).set({isEmailValid : true}).where(eq(usersTable.email, email));
}

export const clearVerifyEmailTokens = async (email) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

    return await db.delete(verifyEmailTokenTable).where(eq(verifyEmailTokenTable.userId, user.id));
}

export const sendNewVerifyEmail = async ({email, userId}) => {
    const randomToken = generateRandomToken();
    
      await insertVerifyEmailTokenInDb({userId, token : randomToken});
    
      const verifyEmailLink = await createVerifyEmailLink({
        email,
        token : randomToken
      });
    
      const mjmlTemplate = await fs.readFile(path.join(import.meta.dirname, "..", "emails", "verify-email.mjml"), 'utf-8');

      const filledTemplate = ejs.render(mjmlTemplate, {code: randomToken, link: verifyEmailLink});

      //to convert mjml to html
      const htmlOutput = mjml2html(filledTemplate).html;

      await sendEmail({
        to : email,
        subject : "Verify your Email",
        html : htmlOutput
        }).catch(console.error);
}


export const updateUsersTableInDB = async ({userId, name}) => {
    return await db.update(usersTable).set({name}).where(eq(usersTable.id, userId));
}

export const updatePassInDB = async ({userId, password}) => {
    return await db.update(usersTable).set({password}).where(eq(usersTable.id, userId));
}

export const generateResetPassToken = () => {
    return crypto.randomBytes(32).toString("hex");
}

export const hashingTokens = async (token) => {
    return await argon2.hash(token);
}

export const insertResetTokenInDB = async ({token, userId}) => {
    return db.insert(passwordResetTokenTable).values({tokenHash : token, userId: userId});
}

export const createVerifyResetPassEmailLink = async ({token}) => {
    const url = new URL(`${process.env.FRONTEND_URL}/reset-password`);
    url.searchParams.append('token', token);

    return url.toString();
}

export const sendNewResetPasswordEmail = async ({email, userId}) => {
    //generate token & hash it and later on store it in db
    const token = generateResetPassToken();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await db.delete(passwordResetTokenTable).where(eq(passwordResetTokenTable.userId, userId));

    await insertResetTokenInDB({token : hashedToken, userId: userId});

    return await createVerifyResetPassEmailLink({ token });
}