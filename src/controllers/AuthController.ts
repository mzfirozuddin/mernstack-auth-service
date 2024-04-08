import { Response } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";

export class AuthController {
    // userService: UserService;

    // //- Dependency Injection receive
    // constructor(userService: UserService) {
    //     this.userService = userService;
    // }

    //* OR
    //- Dependency Injection receive
    constructor(private userService: UserService) {}

    async register(req: RegisterUserRequest, res: Response) {
        const { firstName, lastName, email, password } = req.body;
        await this.userService.create({ firstName, lastName, email, password });
        res.status(201).json();
    }
}
