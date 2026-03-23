import z from "zod";

export const emailSchema = 
        z
        .string()
        .trim()
        .email({message : "Please enter a valid email address"});
        
export const resetPassEmailSchema = z.object({
    email : emailSchema
});

export const passwordSchema = 
        z
        .string()
        .min(6, {message: "Password must be atleast 6 chars long"})
        .max(100, {message: "Name must not be more than 100 chars!"})


export const loginUserSchema = z.object({
    email: emailSchema,
    password: passwordSchema
});

export const nameSchema = 
        z
        .string()
        .trim()
        .min(3, {message : "Name must be atleast 3 chars long!"})
        .max(100, {message: "Name must not be more than 100 chars!"});

export const updateProfileSchema = z.object({
    name : z
    .string()
    .trim()
    .min(3, {message : "Name must be atleast 3 chars long!"})
    .max(100, {message: "Name must not be more than 100 chars!"})
})


export const registrationSchema = loginUserSchema.extend({
    name : nameSchema
});

export const verifyEmailSchema = z.object({
    token: z.string().trim().length(8),
    email: emailSchema
});

export const verifyPasswordSchema = z.object({
    currentPassword: z
    .string()
    .min(1, {message: "Current password is required!"}),
    newPassword: z
    .string()
    .min(6, {message : "New Password must be atleast 6 chars long!"})
    .max(100, {message: "New Password must be no more than 100 chars!"}),
    confirmPassword: z
    .string()
    .min(6, {message : "Confirm Password must be atleast 6 chars long!"})
    .max(100, {message: "Confirm Password must be no more than 100 chars!"}),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password don't match",
    path: ["confirmPassword"]
});
