import Joi from "joi";

export const bookingValidation =
  Joi.object({
    resourceId: Joi.number()
      .integer()
      .positive()
      .required(),

    startTime: Joi.date()
      .iso()
      .required(),

    endTime: Joi.date()
      .iso()
      .greater(Joi.ref("startTime"))
      .required(),
  });