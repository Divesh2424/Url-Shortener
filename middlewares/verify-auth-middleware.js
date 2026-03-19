import { verifyJWT, refreshTokens } from "../services/auth.services.js";

export const verifyAuthentication = async (req, res, next) => {
    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;

    req.user = null;
    if(!accessToken && !refreshToken) {
        return next();
    }

    if(accessToken) {
        const decodedToken = verifyJWT(accessToken);
        req.user = decodedToken;
        return next();
    }

    if(refreshToken) {
        try {
            const {newAccessToken, newRefreshToken, user} = await refreshTokens(refreshToken);
            req.user = user;
            const basicConf = {httpOnly : true, secure : true}
            res.cookie("access_token", newAccessToken, {
                ...basicConf,
                maxAge : 15 * 60 * 1000 //15 minutes
            })
            res.cookie("refresh_token", newRefreshToken, {
                ...basicConf,
                maxAge : 7 * 24 * 60 * 60 * 1000 //7 days
            })
            return next();
        } catch (error) {
            console.log(error.message);
        }
    }
    return next();
}