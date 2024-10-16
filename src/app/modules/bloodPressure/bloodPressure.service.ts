import httpStatus from "http-status";
import mongoose from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TTokenUser } from "../../types/common";
import { sendNotification } from "../notification/sendNotification";
import UserModel from "../user/user.model";
import { TBloodPressure } from "./bloodPressure.interface";
import { BloodPressureModel } from "./bloodPressure.model";
import { ConnectionServices } from "../connections/connection.service";
import { TUser } from "../user/user.interface";

const createBloodPressureIntoDb = async (user: TTokenUser, payload: TBloodPressure) => {
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

  const map = (payload.systolic + 2 * payload.diastolic) / 3;
  const bloodPressureData = {
    user: userData._id,
    data: map.toFixed(2),
    date: payload.date,
    time: payload.time,
    systolic: payload.systolic,
    diastolic: payload.diastolic,
  };

  const patientConnectedDoctor = await ConnectionServices.getMyConnectionById(
    userData._id.toString(),
  );

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const newBloodPressure = await BloodPressureModel.updateOne(
      { user: userData._id, date: payload.date, time: payload.time },
      bloodPressureData,
      { upsert: true },
    ).session(session);

    //In case of blood pressure equal or higher than 130/85 or MAP (mean arterial
    //pressure) higher than 100, an alarm should be placed to say “you blood
    //pressure is increasing, check it again at rest in 2 hours”

    console.log({ payload: userData.fcmToken, });

    if (
      Number(bloodPressureData.data) > 100 ||
      bloodPressureData.systolic > 130 ||
      bloodPressureData.diastolic > 85
    ) {
      if (userData.fcmToken) {
        sendNotification([userData.fcmToken], {
          title: "High Blood Pressure",
          body: "you blood pressure is increasing, check it again at rest in 2 hours",
          type: "bloodPressure",
          userId: userData._id.toString(),
        });

        if (patientConnectedDoctor?.length) {
          for (const doctor of patientConnectedDoctor) {
            //@ts-ignore
            sendNotification([doctor.doctor.fcmToken], {
              title: `${userData.name} High Blood Pressure`,
              body: "you blood pressure is increasing, check it again at rest in 2 hours",
              type: "bloodPressure",
              userId: userData._id.toString(),
            });
          }
        }
      }
    }

    //    In case of blood pressure equal or higher than 140/190 or MAP (mean arterial
    //pressure) higher than 106.7, an alarm should be placed to say “you blood
    //pressure is high, call your doctor and check it again at rest in 2 hours”
    else if (
      Number(bloodPressureData.data) > 106.7 ||
      bloodPressureData.systolic > 140 ||
      bloodPressureData.diastolic > 190
    ) {
      if (userData.fcmToken) {
        sendNotification([userData.fcmToken], {
          title: "High Blood Pressure",
          body: "you blood pressure is increasing, check it again at rest in 2 hours",
          type: "bloodPressure",
          userId: userData._id.toString(),
        });
        if (patientConnectedDoctor?.length) {
          for (const doctor of patientConnectedDoctor) {
            //@ts-ignore
            sendNotification([doctor.doctor.fcmToken], {
              title: `${userData.name} High Blood Pressure`,
              body: "you blood pressure is increasing, check it again at rest in 2 hours",
              type: "bloodPressure",
              userId: userData._id.toString(),
            });
          }
        }
      }
    }

    //   In case of blood pressure equal or higher than 160/110 or MAP (mean arterial
    //pressure) higher than 126.7, an alarm should be placed to say “you blood
    //pressure severely high, immediately call your doctor”
    else if (
      Number(bloodPressureData.data) > 126.7 ||
      bloodPressureData.systolic > 160 ||
      bloodPressureData.diastolic > 110
    ) {
      if (userData.fcmToken) {
        sendNotification([userData.fcmToken], {
          title: "High Blood Pressure",
          body: "you blood pressure is increasing, check it again at rest in 2 hours",
          type: "bloodPressure",
          userId: userData._id.toString(),
        });
        if (patientConnectedDoctor?.length) {
          for (const doctor of patientConnectedDoctor) {
            //@ts-ignore
            sendNotification([doctor.doctor.fcmToken], {
              title: `${userData.name} High Blood Pressure`,
              body: "you blood pressure is increasing, check it again at rest in 2 hours",
              type: "bloodPressure",
              userId: userData._id.toString(),
            });
          }
        }
      }
    }

    await session.commitTransaction();
    session.endSession();
    return newBloodPressure;
  } catch (error: any) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }

  // CALCULATION FORMULA
  // MAP = [systolic blood pressure + (2 X diastolic blood pressure)] / 3
};

const getBloodPressuresFromDb = async (user: TTokenUser, query: Record<string, unknown>) => {
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

  //if (query.date) {
  //  query.date = moment(query.date).startOf("day").toDate();
  //}
  //console.log({query})
  console.log(query);

  const bloodPressureQuery = new QueryBuilder(
    BloodPressureModel,
    BloodPressureModel.find({ user: userData._id }),
    query,
  )
    .search(["date", "time"], {})
    .filter();
  const result = await bloodPressureQuery.modelQuery;

  return result;
};

const getLatestBloodPressureDataFromDb = async (user: TTokenUser) => {
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

  const latestData = await BloodPressureModel.aggregate([
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

export const BloodPressureServices = {
  createBloodPressureIntoDb,
  getBloodPressuresFromDb,
  getLatestBloodPressureDataFromDb,
};
