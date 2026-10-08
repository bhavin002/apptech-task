import { Request, Response } from "express";
import Resource from "../models/resource.model";
import { CommonResponse } from "../utils/common-response";

export default class ResourceController {
  commonResponse = new CommonResponse();

  create = async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        name,
        timezone,
      } = req.body;

      const resource =
        await Resource.create({
          name,
          timezone,
        });

      this.commonResponse.status = 201;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Resource created successfully";
      this.commonResponse.data = resource;
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
      const resources =
        await Resource.findAll({
          order: [["id", "DESC"]],
        });

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Resources fetched successfully";
      this.commonResponse.data = resources;
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

  getById = async (
    req: Request,
    res: Response
  ) => {
    try {
      const resource =
        await Resource.findByPk(
          Number(req.params.id)
        );

      if (!resource) {
        throw new Error(
          "Resource not found."
        );
      }

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Resource fetched successfully";
      this.commonResponse.data = resource;
    } catch (error: any) {
      this.commonResponse.status = 404;
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
      const resource =
        await Resource.findByPk(
          Number(req.params.id)
        );

      if (!resource) {
        throw new Error(
          "Resource not found."
        );
      }

      await resource.update(req.body);

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Resource updated successfully";
      this.commonResponse.data = resource;
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
      const resource =
        await Resource.findByPk(
          Number(req.params.id)
        );

      if (!resource) {
        throw new Error(
          "Resource not found."
        );
      }

      await resource.destroy();

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Resource deleted successfully";
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