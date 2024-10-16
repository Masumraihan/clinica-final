import { getMessaging } from "firebase-admin/messaging";
import NotificationModel from "./notification.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { TTokenUser } from "../../types/common";
import UserModel from "../user/user.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createNotificationIntoDb = async (userId: string) => {
  // This registration token comes from the client FCM SDKs.
  const registrationToken = "YOUR_REGISTRATION_TOKEN";
  const message = {
    data: {
      score: "850",
      time: "2:45",
    },
    token: registrationToken,
  };

  // Send a message to the device corresponding to the provided
  // registration token.

  getMessaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

const getNotificationFromDb = async (user: TTokenUser, query: Record<string, unknown>) => {
  const userData = await UserModel.findOne({ email: user.email }).lean();
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

  const notificationQuery = new QueryBuilder(
    NotificationModel,
    NotificationModel.find({ fcmToken: userData.fcmToken }).sort({ createdAt: -1 }),
    query,
  ).filter();

  const result = await notificationQuery.modelQuery;
  return result;
};

const readNotificationFromDb = async (fcmToken: string, query: Record<string, unknown> = {}) => {
  query.fcmToken = fcmToken;
  const result = await NotificationModel.updateMany(query, { isRead: true }).lean();
  return result;
};

export const NotificationServices = {
  createNotificationIntoDb,
  getNotificationFromDb,
  readNotificationFromDb,
};
