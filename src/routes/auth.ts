import express from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository); //- Dependency Injection
const authController = new AuthController(userService); //- Dependency Injection

// router.post("/register", authController.register);
//: If binding issue is happen then do this
router.post("/register", (req, res) => authController.register(req, res));

export default router;
