import z from "zod";

export const urlSchema = z.object({
    enterurl : z
    .string()
    .url({message : "Please enter a valid URL"}),
    shorturl : z
    .string()
    .min(3, {message : "Short URL must be atleast 3 characters"})
    .max(20, {message : "Short URL too long"})
    .optional()
});

export const shortnerSearchParamSchema = z.object({
    page: z.coerce
        .number()
        .int()
        .positive()
        .min(1)
        .optional()
        .default(1)
        .catch(1)
})