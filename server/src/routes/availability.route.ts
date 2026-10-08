import express from "express";

import AvailabilityController from "../controllers/availability.controller";

import {
  validateMiddleware,
} from "../middlewares/validation.middleware";

import {
  availabilityValidation,
} from "../validator/availability.validator";

import {
  requireSignIn,
} from "../middlewares/auth.middleware";

const router = express.Router();

const controller =
  new AvailabilityController();

router.post(
  "/:resourceId/availability",
  requireSignIn,
  validateMiddleware(
    availabilityValidation
  ),
  controller.create
);

router.get(
  "/:resourceId/availability",
  requireSignIn,
  controller.list
);

router.put(
  "/:resourceId/availability/:id",
  requireSignIn,
  validateMiddleware(
    availabilityValidation
  ),
  controller.update
);

router.delete(
  "/:resourceId/availability/:id",
  requireSignIn,
  controller.delete
);

export default router;