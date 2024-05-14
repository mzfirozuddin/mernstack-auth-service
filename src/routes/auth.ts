import express, { NextFunction, Request, Response } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidator from "../validators/register-validator";
import { TokenService } from "../services/TokenService";
import { RefreshToken } from "../entity/RefreshToken";
import loginValidator from "../validators/login-validator";
import { CredentialService } from "../services/CredentialService";
import authenticate from "../middlewares/authenticate";
import { AuthRequest } from "../types";
import validateRefreshToken from "../middlewares/validateRefreshToken";
// import { body } from "express-validator";

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository); //- Dependency Injection
const refreshTokenService = AppDataSource.getRepository(RefreshToken);
const tokenService = new TokenService(refreshTokenService); //- Dependency Injection
const credentialService = new CredentialService();
const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentialService,
); //- Dependency Injection

// router.post("/register", authController.register);
//: If binding issue is happen then do this
router.post(
    "/register",
    registerValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
);

router.post(
    "/login",
    loginValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.login(req, res, next),
);

//: Protected Route
// authenticate middleware used to verify token and inject user(auth) data in "req" object
router.get("/self", authenticate, (req: Request, res: Response) =>
    authController.self(req as AuthRequest, res),
);

router.post(
    "/refresh",
    validateRefreshToken,
    (req: Request, res: Response, next: NextFunction) =>
        authController.refresh(req as AuthRequest, res, next),
);

export default router;

// ================================================================================
//NOTE:
// how to use "express-validator" for validation?
// we have to use this as a middleware

//- This is for single field "email".
/* 
router.post(
    "/register",
    body("email").notEmpty(),
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
); 
*/

//- If we want to validate multiple field
/* 
router.post(
    "/register",
    [
        body("email").notEmpty(),
        body("firstName").notEmpty(),
        body("lastName").notEmpty(),
    ],
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
); 
*/
