import express from "express";

import AuthController from "../controllers/auth.controller";

import {
  registerValidation,
  loginValidation,
} from "../validator/auth.validator";

import {
  validateMiddleware,
} from "../middlewares/validation.middleware";

const router = express.Router();

const authController = new AuthController();

router.post(
  "/signup",
  validateMiddleware(registerValidation),
  authController.signup
);

router.post(
  "/login",
  validateMiddleware(loginValidation),
  authController.login
);

export default router;