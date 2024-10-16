import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TTokenUser } from "../../types/common";
import { ConnectionServices } from "../connections/connection.service";
import { sendNotification } from "../notification/sendNotification";
import UserModel from "../user/user.model";
import { TGlucose } from "./glucose.interface";
import { GlucoseModel } from "./glucose.model";

const createGlucoseIntoDb = async (user: TTokenUser, payload: TGlucose) => {
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
  const glucoseData = {
    user: userData._id,
    date: payload.date,
    time: payload.time,
    label: payload.label,
    data: payload.data,
  };

  const newWeight = await GlucoseModel.updateOne(
    { user: userData._id, date: payload.date, time: payload.time },
    glucoseData,
    { upsert: true },
  );

  const patientConnectedDoctor = await ConnectionServices.getMyConnectionById(
    userData._id.toString(),
  );

  if (userData.fcmToken) {
    //  In case fasting glucose is equal or higher than 95 (“you fasting glucose is higher than expected”)

    if (glucoseData.data >= 95 && payload.label !== "Free Measurement") {
      sendNotification([userData?.fcmToken], {
        title: "Alert",
        body: `you fasting glucose is higher than expected`,
        type: "glucose",
        userId: userData?._id.toString(),
      });
      if (patientConnectedDoctor?.length) {
        for (const doctor of patientConnectedDoctor) {
          //@ts-ignore
          sendNotification([doctor.doctor.fcmToken], {
            title: `${userData.name} High Glucose`,
            body: userData.name + " 1 hour glucose is higher than expected",
            type: "glucose",
            userId: userData._id.toString(),
          });
        }
      }
    }
    //    In case 1-hour glucose is equal or higher than 140 (“you 1 hour glucose is higher than expected”)
    else if (glucoseData.data >= 140 && payload.label !== "Free Measurement") {
      sendNotification([userData?.fcmToken], {
        title: "Alert",
        body: `You 1 hour glucose is higher than expected`,
        type: "glucose",
        userId: userData?._id.toString(),
      });
      if (patientConnectedDoctor?.length) {
        for (const doctor of patientConnectedDoctor) {
          //@ts-ignore
          sendNotification([doctor.doctor.fcmToken], {
            title: `${userData.name} High Glucose`,
            body: userData.name + " 1 hour glucose is higher than expected",
            type: "bloodPressure",
            userId: userData._id.toString(),
          });
        }
      }
    }

    //    In case 1-hour glucose is equal or higher than 140 (“you 1 hour glucose is higher than expected”
    else if (glucoseData.data >= 120 && payload.label !== "Free Measurement") {
      sendNotification([userData?.fcmToken], {
        title: "Alert",
        body: `You 2 hour glucose is higher than expected`,
        type: "glucose",
        userId: userData?._id.toString(),
      });
      if (patientConnectedDoctor?.length) {
        for (const doctor of patientConnectedDoctor) {
          //@ts-ignore
          sendNotification([doctor.doctor.fcmToken], {
            title: `${userData.name} High Glucose`,
            body: userData.name + " 1 hour glucose is higher than expected",
            type: "glucose",
            userId: userData._id.toString(),
          });
        }
      }
    }

    //      In case 2-hour glucose is equal or higher than 120 (“you 2 hour glucose is higher than expected”)
    else if (glucoseData.data <= 70) {
      sendNotification([userData?.fcmToken], {
        title: "Alert",
        body: `“you 2 hour glucose is higher than expected`,
        type: "glucose",
        userId: userData?._id.toString(),
      });
      if (patientConnectedDoctor?.length) {
        for (const doctor of patientConnectedDoctor) {
          //@ts-ignore
          sendNotification([doctor.doctor.fcmToken], {
            title: `${userData.name} High Glucose`,
            body: userData.name + " 1 hour glucose is higher than expected",
            type: "glucose",
            userId: userData._id.toString(),
          });
        }
      }
    }
  }

  return newWeight;
};

const getGlucoseFromDb = async (user: TTokenUser, query: Record<string, unknown>) => {
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

  //if (query?.date) {
  //  query.date = moment(query.date).startOf("day").toDate();
  //}

  const glucoseQuery = new QueryBuilder(
    GlucoseModel,
    GlucoseModel.find({ user: userData._id }),
    query,
  ).filter();
  const result = await glucoseQuery.modelQuery;
  return result;
};

const getLatestGlucoseDataFromDb = async (user: TTokenUser) => {
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

  const latestData = await GlucoseModel.aggregate([
    {
      // Match documents by user
      $match: { user: userData._id },
    },
    {
      // Add a new field that combines date and time into a Date object
      $addFields: {
        combinedDateTime: {
          $dateFromString: {
            dateString: {
              $concat: ["$date", "T", "$time", ":00"], // Combining into an ISO string
            },
            format: "%d-%m-%YT%H:%M:%S", // Adjusted format for dd-mm-yyyy and time
            timezone: "UTC",
          },
        },
      },
    },
    {
      // Sort by the new combinedDateTime field in descending order
      $sort: { combinedDateTime: -1 },
    },
    {
      // Limit to only the most recent document
      $limit: 1,
    },
  ]).exec();
  return latestData[0];
};

export const GlucoseServices = {
  createGlucoseIntoDb,
  getGlucoseFromDb,
  getLatestGlucoseDataFromDb,
};
