import Joi from "joi";

export const resourceValidation =
  Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required(),

    timezone: Joi.string()
      .required(),
  });