import { NextFunction, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
import { TokenService } from "../services/TokenService";

export class AuthController {
    // userService: UserService;

    // //- Dependency Injection receive
    // constructor(userService: UserService) {
    //     this.userService = userService;
    // }

    //* OR
    //- Dependency Injection receive
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        //- Validation
        //: We have to validate the "req" first
        const result = validationResult(req);
        // console.log(result);

        // result.isEmpty() == true means no error.
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const { firstName, lastName, email, password } = req.body;

        //: This is a Manually validation but we will use a library
        /* if (!email) {
            // return res.status(400).json({ message: "Email is required!" });

            //: Or we can create a error and throw.
            const error = createHttpError(400, "Email is required!");
            return next(error);
        } */

        //: use a logger
        this.logger.debug("New request to register a user", {
            firstName,
            lastName,
            email,
            password: "********",
        });

        try {
            //: save data on DB
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });

            this.logger.info("User has been registered", { id: user.id });

            //: generate access token and refresh token

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);
            // console.log(accessToken);

            // Persist the refresh token
            const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365; // 1Y -> (Non Leap Year)
            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken);
            const newRefreshToken = await refreshTokenRepository.save({
                user: user,
                expiresAt: new Date(Date.now() + MS_IN_YEAR),
            });

            // const refreshToken = jwt.sign(
            //     payload,
            //     Config.REFRESH_TOKEN_SECRET!,
            //     {
            //         algorithm: "HS256",
            //         expiresIn: "1y",
            //         issuer: "auth-service",
            //         jwtid: String(newRefreshToken.id),
            //     },
            // );

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            //: set accessToken and refreshToke in cookies
            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // 1 hour
                httpOnly: true, // Very Important
            });

            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
                httpOnly: true, // Very Important
            });

            res.status(201).json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }
}
