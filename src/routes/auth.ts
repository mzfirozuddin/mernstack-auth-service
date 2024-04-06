import express from "express";
import { AuthController } from "../controllers/AuthController";

const router = express.Router();
const authController = new AuthController();

router.post("/register", authController.register);
//: If binding issue is happen then do this
// router.post("/register", (req, res) => authController.register(req, res));

export default router;
