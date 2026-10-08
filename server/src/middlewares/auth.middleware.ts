import { Request, Response, NextFunction } from "express";
import JWT from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const requireSignIn = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return res.status(401).send({
        success: false,
        status: 401,
        message: "Authorization token is required",
        data: [],
      });
    }

    const token = authorization.startsWith("Bearer ")
      ? authorization.substring(7)
      : authorization;

    const decoded = JWT.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      id: number;
      email: string;
    };

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).send({
      success: false,
      status: 401,
      message: "Invalid or expired token",
      data: [],
    });
  }
};