import { Request, Response } from "express";
import User from "../models/user.model";
import {
  comparePassword,
  generateToken,
  hashPassword,
} from "../utils/auth.helper";
import { CommonResponse } from "../utils/common-response";

export default class AuthController {
  commonResponse = new CommonResponse();

  signup = async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
      } = req.body;

      const existingUser = await User.findOne({
        where: {
          email: email.toLowerCase(),
        },
      });

      if (existingUser) {
        throw new Error(
          "Account already exists."
        );
      }

      const hashedPassword =
        await hashPassword(password);

      const user = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: hashedPassword,
        isActive: true,
      });

      const token = generateToken({
        id: user.id,
        email: user.email,
      });

      this.commonResponse.status = 201;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Account created successfully";

      this.commonResponse.data = {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        token,
      };
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

  login = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { email, password } =
        req.body;

      const user = await User.findOne({
        where: {
          email: email.toLowerCase(),
        },
      });

      if (!user) {
        throw new Error(
          "Invalid email or password."
        );
      }

      const isPasswordValid =
        await comparePassword(
          password,
          user.password
        );

      if (!isPasswordValid) {
        throw new Error(
          "Invalid email or password."
        );
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
      });

      this.commonResponse.status = 200;
      this.commonResponse.success = true;
      this.commonResponse.message =
        "Login successfully";

      this.commonResponse.data = {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        token,
      };
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