import Joi from "joi";

export const availabilityValidation =
  Joi.object({
    dayOfWeek: Joi.number()
      .integer()
      .min(0)
      .max(6)
      .required(),

    startTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required(),

    endTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required(),
  });