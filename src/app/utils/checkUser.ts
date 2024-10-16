import config from "../config";
import AppError from "../errors/AppError";
import jwt from "jsonwebtoken";
import { TTokenUser } from "../types/common";
import httpStatus from "http-status";
import UserModel from "../modules/user/user.model";
export const checkUser = async (token: string) => {
  try {
    const user = jwt.verify(token, config?.jwt_access_secret) as TTokenUser;
    const userData = await UserModel.findById(user._id);
    if (!userData) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
    }
    if (!userData.isActive) {
      throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
    }
    if (userData.isDelete) {
      throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
    }
    if (!userData.validation?.isVerified) {
      throw new AppError(httpStatus.BAD_REQUEST, "Your Account is not verified");
    }
  } catch (error) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token");
  }
};
