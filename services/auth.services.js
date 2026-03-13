import { db } from "../config/db.js";
import { usersTable } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

export const getUserByEmail = async (email) => {
    const [getUser] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return getUser;
}

export const saveData = async ({name, email, password}) => {
    const savedData = await db.insert(usersTable).values({ name, email, password });
    return savedData;
}

export const hashingPasswords = async (password) => {
    return await argon2.hash(password);
}

export const comparePasswords = async (password, hash) => {
    return await argon2.verify(hash, password)
}

export const generateToken = async ({id, name, email}) => {
    return jwt.sign({id, name, email}, process.env.JWT_SECRET, {
        expiresIn: "30d"
    })
}

export const verifyJWT = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
}