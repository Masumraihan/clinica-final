import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import AppError from "../errors/AppError";
import { CustomRequest, TTokenUser, TUserRole } from "../types/common";
import catchAsync from "../utils/catchAsync";
import UserModel from "../modules/user/user.model";
import httpStatus from "http-status";

const auth = (...requiredRole: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    // CHECK TOKEN IS GIVEN OR NOT
    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    // VERIFY TOKEN
    let decode;
    try {
      decode = jwt.verify(token?.split(" ")[1], config.jwt_access_secret as string) as TTokenUser;
    } catch (error) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Session Expired");
    }

    const { role, email, iat } = decode;
    // CHECK USER EXIST OR NOT
    const userData = await UserModel.findOne({ email, isActive: true, isDelete: false });

    if (!userData) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    if (!userData) {
      throw new AppError(httpStatus.NOT_FOUND, "Invalid Email");
    }
  
    if (!userData.isActive) {
      throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
    }
    if (userData.isDelete) {
      throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
    }

    if (userData.validation?.isVerified === false) {
      throw new AppError(httpStatus.BAD_REQUEST, "Account is not verified");
    }


    // CHECK USER ROLE
    if (requiredRole.length && !requiredRole.includes(role)) {
      throw new AppError(httpStatus.FORBIDDEN, "Unauthorized");
    }

    (req as CustomRequest).user = decode;
    next();
  });
};

export default auth;
