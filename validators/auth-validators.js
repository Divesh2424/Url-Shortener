import z from "zod";

export const loginUserSchema = z.object({
    email: z
        .string()
        .trim()
        .email({message : "Please enter a valid email address"}),
    password: z
        .string()
        .min(6, {message: "Password must be atleast 6 chars long"})
        .max(100, {message: "Name must not be more than 100 chars!"}),
});

export const nameSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, {message : "Name must be atleast 3 chars long!"})
        .max(100, {message: "Name must not be more than 100 chars!"})
});

export const registrationSchema = loginUserSchema.extend({
    name : nameSchema
});

export const verifyEmailSchema = z.object({
    token: z.string().trim().length(8),
    email: z.string().trim().email()
});
