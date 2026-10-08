import { Response } from "express";

import Booking from "../models/booking.model";
import Resource from "../models/resource.model";

import {
  AuthRequest,
} from "../middlewares/auth.middleware";

import { CommonResponse } from "../utils/common-response";

export default class BookingController {
  commonResponse = new CommonResponse();

  create = async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        throw new Error(
          "Authentication required."
        );
      }

      const {
        resourceId,
        startTime,
        endTime,
      } = req.body;

      const resource =
        await Resource.findByPk(
          resourceId
        );

      if (!resource) {
        throw new Error(
          "Resource not found."
        );
      }

      const booking =
        await Booking.create({
          userId: req.user.id,
          resourceId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
        });

      this.commonResponse.status = 201;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Booking created successfully";
      this.commonResponse.data =
        booking;
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
    req: AuthRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        throw new Error(
          "Authentication required."
        );
      }

      const bookings =
        await Booking.findAll({
          where: {
            userId: req.user.id,
          },
          order: [
            ["startTime", "ASC"],
          ],
        });

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Bookings fetched successfully";
      this.commonResponse.data =
        bookings;
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
    req: AuthRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        throw new Error(
          "Authentication required."
        );
      }

      const booking =
        await Booking.findOne({
          where: {
            id: Number(req.params.id),
            userId: req.user.id,
          },
        });

      if (!booking) {
        throw new Error(
          "Booking not found."
        );
      }

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Booking fetched successfully";
      this.commonResponse.data =
        booking;
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
    req: AuthRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        throw new Error(
          "Authentication required."
        );
      }

      const booking =
        await Booking.findOne({
          where: {
            id: Number(req.params.id),
            userId: req.user.id,
          },
        });

      if (!booking) {
        throw new Error(
          "Booking not found."
        );
      }

      await booking.update({
        startTime: new Date(
          req.body.startTime
        ),
        endTime: new Date(
          req.body.endTime
        ),
      });

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Booking updated successfully";
      this.commonResponse.data =
        booking;
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
    req: AuthRequest,
    res: Response
  ) => {
    try {
      if (!req.user) {
        throw new Error(
          "Authentication required."
        );
      }

      const booking =
        await Booking.findOne({
          where: {
            id: Number(req.params.id),
            userId: req.user.id,
          },
        });

      if (!booking) {
        throw new Error(
          "Booking not found."
        );
      }

      await booking.destroy();

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Booking deleted successfully";
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