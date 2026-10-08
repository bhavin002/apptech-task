import express from "express";

import ResourceController from "../controllers/resource.controller";

import {
  validateMiddleware,
} from "../middlewares/validation.middleware";

import {
  resourceValidation,
} from "../validator/resource.validator";

import {
  requireSignIn,
} from "../middlewares/auth.middleware";

const router = express.Router();

const resourceController =
  new ResourceController();

router.post(
  "/",
  requireSignIn,
  validateMiddleware(resourceValidation),
  resourceController.create
);

router.get(
  "/",
  requireSignIn,
  resourceController.list
);

router.get(
  "/:id",
  requireSignIn,
  resourceController.getById
);

router.put(
  "/:id",
  requireSignIn,
  validateMiddleware(resourceValidation),
  resourceController.update
);

router.delete(
  "/:id",
  requireSignIn,
  resourceController.delete
);

export default router;