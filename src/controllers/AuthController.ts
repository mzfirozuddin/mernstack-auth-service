import fs from "fs";
import path from "path";
import { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
// import createHttpError from "http-errors";

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
            let privateKey: Buffer;
            try {
                privateKey = fs.readFileSync(
                    path.join(__dirname, "../../certs/private.pem"),
                );
            } catch (err) {
                const error = createHttpError(
                    500,
                    "Error while reading private key",
                );
                return next(error);
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };

            const accessToken = jwt.sign(payload, privateKey, {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: "auth-service",
            });

            // console.log(accessToken);

            const refreshToken = "dfdgggcvd";

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
