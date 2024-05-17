import { expressjwt } from "express-jwt";
import { Config } from "../config";
import { Request } from "express";
import { AuthCookie } from "../types";

export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET!,
    algorithms: ["HS256"],
    // expressjwt by default find refreshToken in authorization header
    getToken(req: Request) {
        // But we want this to find token in cookies
        const { refreshToken } = req.cookies as AuthCookie;
        return refreshToken;
    },
});
