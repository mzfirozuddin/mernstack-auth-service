import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";

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
        private credentialService: CredentialService,
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

            //- Persist the refresh token in DB
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

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

    async login(req: Request, res: Response, next: NextFunction) {
        //- validation
        //: we have to validate "req" first
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ error: result.array() });
        }

        const { email, password } = req.body;

        //: use a logger
        this.logger.debug("New request to login a user", {
            email,
            password: "********",
        });

        try {
            //: Check if username (email) is exists in DB
            const user = await this.userService.findByEmail(email);
            if (!user) {
                const error = createHttpError(
                    400,
                    "Email or password does not match!",
                );

                return next(error);
            }

            //: Compare password
            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            );
            if (!passwordMatch) {
                const error = createHttpError(
                    400,
                    "Email or password does not match!",
                );

                return next(error);
            }

            //: Generate tokens
            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const accessToken = this.tokenService.generateAccessToken(payload);

            //- Persist the refresh token in DB
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);

            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                id: String(newRefreshToken.id),
            });

            //: Add tokens to cookies
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

            //: log userId
            this.logger.info("User has been logged in.", { id: user.id });

            //: Return the response (id)
            res.status(200).json({ id: user.id, message: "Login Successful." });
        } catch (err) {
            next(err);
            return;
        }
    }

    async self(req: AuthRequest, res: Response) {
        // console.log(req.auth);
        const user = await this.userService.findById(Number(req.auth.sub));
        res.status(200).json(user);
    }
}
