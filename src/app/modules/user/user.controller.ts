import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { UserServices } from "./user.service";
import catchAsync from "../../utils/catchAsync";
import { CustomRequest } from "../../types/common";

const getAllUser = catchAsync(async (req, res) => {
  const { users, meta } = await UserServices.getAllUsersFromDb(req.query);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    meta,
    data: users,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const result = await UserServices.getSingleUserFromDb(req.params.slug);
  console.log("🚀 ~ getSingleUser ~ result:", result);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const result = await UserServices.updateUser(req.params.slug, req.body);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteMyProfile = catchAsync(async (req, res) => {
  const result = await UserServices.deleteMyProfileFromDb((req as any).user);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile deleted successfully",
    data: result,
  });
});

const getUsersCount = catchAsync(async (req, res) => {
  const result = await UserServices.getUsersCount(req.query);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users count fetched successfully",
    data: result,
  });
});

const getProfile = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await UserServices.getUserProfileFromDb(user);
  console.log("🚀 ~ getProfile ~ result:", result);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await UserServices.updateUserIntoDb(user, req.body);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

export const UserControllers = {
  getAllUser,
  getSingleUser,
  updateUser,
  deleteMyProfile,
  getUsersCount,
  getProfile,
  updateProfile,
};
