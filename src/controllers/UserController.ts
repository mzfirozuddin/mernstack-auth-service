import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/UserService";
import {
    CreateUserRequest,
    UpdateUserRequest,
    UserQueryParams,
} from "../types";
import { matchedData, validationResult } from "express-validator";
import { Logger } from "winston";
import createHttpError from "http-errors";

export class UserController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, email, password, role, tenantId } =
            req.body;
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
                role,
                tenantId,
            });

            this.logger.info("User has been created", { id: user.id });

            res.status(201).json({ id: user.id });
        } catch (err) {
            return next(err);
        }
    }

    async update(req: UpdateUserRequest, res: Response, next: NextFunction) {
        // In our project: We are not allowing user to change the email id since it is used as username
        // In our project: We are not allowing admin user to change others password

        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, role } = req.body;
        const userId = req.params.id;

        if (isNaN(Number(userId))) {
            next(createHttpError(400, "Invalid user params!"));
        }

        this.logger.debug("Request for updating a user", req.body);

        try {
            await this.userService.update(Number(userId), {
                firstName,
                lastName,
                role,
            });

            this.logger.info("User has been updated", { id: userId });

            res.status(200).json({ id: Number(userId) });
        } catch (err) {
            return next(err);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        const validatedQuery = matchedData(req, { onlyValidData: true });
        // console.log(validatedQuery);

        try {
            // const users = await this.userService.getAll(validatedQuery);
            //: After pagination
            const [users, count] = await this.userService.getAll(
                validatedQuery as UserQueryParams,
            );

            this.logger.info("All users have been fetched");

            // res.status(200).json(users);
            res.status(200).json({
                currentPage: validatedQuery.currentPage,
                perPage: validatedQuery.perPage,
                total: count,
                data: users,
            });
        } catch (err) {
            return next(err);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;
        if (isNaN(Number(userId))) {
            next(createHttpError(400, "Invalid user param!"));
            return;
        }

        try {
            const user = await this.userService.findById(Number(userId));
            if (!user) {
                next(createHttpError(400, "User does not exist!"));
            }

            this.logger.info("User has been fetched", { id: user?.id });

            res.status(200).json(user);
        } catch (err) {
            return next(err);
        }
    }

    async destroy(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;
        if (isNaN(Number(userId))) {
            next(createHttpError(400, "Invalid user param!"));
            return;
        }

        try {
            await this.userService.deleteById(Number(userId));

            this.logger.info("User has been deleted", { id: Number(userId) });

            res.status(200).json({ id: Number(userId) });
        } catch (err) {
            return next(err);
        }
    }
}
