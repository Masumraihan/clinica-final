import catchAsync from "../../utils/catchAsync";
import { NotificationServices } from "./notification.service";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { CustomRequest } from "src/app/types/common";

const createNotification = catchAsync(async (req, res) => {
  // const result = await NotificationServices.createNotificationIntoDb();
});

const getNotification = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await NotificationServices.getNotificationFromDb(user, req.query);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification fetched successfully",
    data: result,
  });
});

const readNotification = catchAsync(async (req, res) => {
  const result = await NotificationServices.readNotificationFromDb(
    req.headers.token as string,
    req.query,
  );
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification read successfully",
    data: result,
  });
});

export const NotificationControllers = {
  createNotification,
  getNotification,
  readNotification,
};
