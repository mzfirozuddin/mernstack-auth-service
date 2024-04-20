import express, { NextFunction, Request, Response } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidator from "../validators/register-validator";
// import { body } from "express-validator";

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository); //- Dependency Injection
const authController = new AuthController(userService, logger); //- Dependency Injection

// router.post("/register", authController.register);
//: If binding issue is happen then do this
router.post(
    "/register",
    registerValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
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
