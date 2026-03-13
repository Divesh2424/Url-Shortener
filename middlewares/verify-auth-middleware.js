import { verifyJWT } from "../services/auth.services.js";

export const verifyAuthentication = (req, res, next) => {
    const token = req.cookies.access_token;
    if(!token) {
        req.user = null;
        return next();
    }
    const decodedToken = verifyJWT(token);
    req.user = decodedToken;
    return next();
}