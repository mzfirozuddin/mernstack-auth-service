import { NextFunction, Response } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
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

        this.logger.debug("New request to register a user", {
            firstName,
            lastName,
            email,
            password: "********",
        });

        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });

            this.logger.info("User has been registered", { id: user.id });
            res.status(201).json({ id: user.id });
        } catch (err) {
            next(err);
            return;
        }
    }
}
