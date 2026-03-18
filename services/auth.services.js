import { db } from "../config/db.js";
import { sessionsTable, shortLinkTable, usersTable, verifyEmailTokenTable } from "../drizzle/schema.js";
import { eq, sql } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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
    await db.delete(verifyEmailTokenTable).where(lt(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`));
    return await db.insert(verifyEmailTokenTable).values({userId, token});
}

export const createVerifyEmailLink = async ({email, token}) => {
    const uriEncodedEmail = encodeURIComponent(email);
    return `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${uriEncodedEmail}`;
}