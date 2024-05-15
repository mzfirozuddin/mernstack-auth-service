import { expressjwt } from "express-jwt";
import { Config } from "../config";
import { Request } from "express";
import { AuthCookie, IRefreshTokenPayload } from "../types";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
import logger from "../config/logger";

export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET!,
    algorithms: ["HS256"],
    // expressjwt by default find refreshToken in authorization header
    getToken(req: Request) {
        // But we want this to find token in cookies
        const { refreshToken } = req.cookies as AuthCookie;
        return refreshToken;
    },

    async isRevoked(request: Request, token) {
        // console.log("Token: ", token);

        try {
            const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
            // If refreshToken not found then it return null
            const refreshToken = await refreshTokenRepo.findOne({
                where: {
                    id: Number((token?.payload as IRefreshTokenPayload).id),
                    user: {
                        id: Number(token?.payload.sub),
                    },
                },
            });
            // console.log("Flag: ", refreshToken);

            return refreshToken === null; // If refreshToken is null then it return true
        } catch (err) {
            logger.error("Error while getting the refresh token", {
                id: (token?.payload as IRefreshTokenPayload).id,
            });
        }

        return true;
    },
});
