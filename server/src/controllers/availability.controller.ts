import { Request, Response } from "express";
import Availability from "../models/availability.model";
import Resource from "../models/resource.model";
import { CommonResponse } from "../utils/common-response";

export default class AvailabilityController {
  commonResponse = new CommonResponse();

  create = async (
    req: Request,
    res: Response
  ) => {
    try {
      const resourceId =
        Number(req.params.resourceId);

      const resource =
        await Resource.findByPk(
          resourceId
        );

      if (!resource) {
        throw new Error(
          "Resource not found."
        );
      }

      const availability =
        await Availability.create({
          resourceId,
          dayOfWeek: req.body.dayOfWeek,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        });

      this.commonResponse.status = 201;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Availability created successfully";
      this.commonResponse.data =
        availability;
    } catch (error: any) {
      this.commonResponse.status = 400;
      this.commonResponse.success = false;
      this.commonResponse.message =
        error.message;
      this.commonResponse.data = [];
    }

    return res
      .status(this.commonResponse.status)
      .send(this.commonResponse);
  };

  list = async (
    req: Request,
    res: Response
  ) => {
    try {
      const availability =
        await Availability.findAll({
          where: {
            resourceId:
              Number(req.params.resourceId),
          },
          order: [["dayOfWeek", "ASC"]],
        });

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Availability fetched successfully";
      this.commonResponse.data =
        availability;
    } catch (error: any) {
      this.commonResponse.status = 400;
      this.commonResponse.success = false;
      this.commonResponse.message =
        error.message;
      this.commonResponse.data = [];
    }

    return res
      .status(this.commonResponse.status)
      .send(this.commonResponse);
  };

  update = async (
    req: Request,
    res: Response
  ) => {
    try {
      const availability =
        await Availability.findByPk(
          Number(req.params.id)
        );

      if (!availability) {
        throw new Error(
          "Availability not found."
        );
      }

      await availability.update(
        req.body
      );

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Availability updated successfully";
      this.commonResponse.data =
        availability;
    } catch (error: any) {
      this.commonResponse.status = 400;
      this.commonResponse.success = false;
      this.commonResponse.message =
        error.message;
      this.commonResponse.data = [];
    }

    return res
      .status(this.commonResponse.status)
      .send(this.commonResponse);
  };

  delete = async (
    req: Request,
    res: Response
  ) => {
    try {
      const availability =
        await Availability.findByPk(
          Number(req.params.id)
        );

      if (!availability) {
        throw new Error(
          "Availability not found."
        );
      }

      await availability.destroy();

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Availability deleted successfully";
      this.commonResponse.data = [];
    } catch (error: any) {
      this.commonResponse.status = 400;
      this.commonResponse.success = false;
      this.commonResponse.message =
        error.message;
      this.commonResponse.data = [];
    }

    return res
      .status(this.commonResponse.status)
      .send(this.commonResponse);
  };
}