import admin from "firebase-admin";
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import NotificationModel from "./notification.model";
import config from "../../config";
import file from "../../../public/clinica-b05e8-firebase-admin-sdk.json";
// Initialize Firebase Admin with a service account

//const configPath = path.join(process.cwd(), "clinica-b05e8-firebase-admin-sdk.json");

//const firebaseConfig: admin.ServiceAccount = {
//  clientEmail: config.firebase.client_email,
//  privateKey: config.firebase.private_key,
//  projectId: config.firebase.project_id,
//};

admin.initializeApp({
  credential: admin.credential.cert(file as any),
});

type NotificationPayload = {
  title: string;
  body: string;
  data?: { [key: string]: string };
  link?: string;
  type: string;
  userId: string;
  time?: string;
};

export const sendNotification = async (
  fcmToken: string[],
  payload: NotificationPayload,
): Promise<any> => {
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      apns: {
        headers: {
          "apns-push-type": "alert",
        },
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
    });

    if (response.successCount) {
      fcmToken?.map(async (token) => {
        try {
          if (token) {
            const newNotification = await NotificationModel.create({
              fcmToken: token,
              title: payload.title,
              message: payload.body,
              date: new Date(),
              isRead: false,
              link: payload.link,
              time: payload.time,
              type: payload.type,
              userId: payload.userId,
            });
          } else {
            console.log("Token not found");
          }
        } catch (error) {
          console.log(error);
        }
      });
    }

    return response;
  } catch (error: any) {
    console.error("Error sending message:", error);
    if (error?.code === "messaging/third-party-auth-error") {
      return null;
    } else {
      console.error("Error sending message:", error);
      throw new AppError(
        httpStatus.NOT_IMPLEMENTED,
        error.message || "Failed to send notification",
      );
    }
  }
};
