import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TTokenUser } from "../../types/common";
import PatientModel from "../patient/patient.model";
import UserModel from "../user/user.model";
import { TWeight } from "./weight.interface";
import { WeightModel } from "./weight.model";
import { TWeightGainTracker } from "../weightGainTracker/weightGainTracker.interface";
import mongoose, { Schema } from "mongoose";
import WeightGainTrackerModel from "../weightGainTracker/weightGainTracker.model";
import { TPatient } from "../patient/patient.interface";
import { PatientServices } from "../patient/patient.service";
import { sendNotification } from "../notification/sendNotification";
import { TUser } from "../user/user.interface";
import { ConnectionServices } from "../connections/connection.service";
import ConnectionModel from "../connections/connection.model";
import {
  calculateBMI,
  getDailyMeanWeight,
  getMonthlyAvgWeight,
  getOverallAvgWeight,
  getWeeklyAvgWeight,
} from "./weight.utils";
import moment from "moment";

const createWeightIntoDb = async (user: TTokenUser, payload: TWeight) => {
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

  const patientData = await PatientModel.findOne({ user: userData._id });
  if (!patientData) {
    throw new AppError(httpStatus.BAD_REQUEST, "Patient not found");
  }

  // Normalize date to ignore time
  const today = new Date(payload.date);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1); // End of the same day

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Find the last weight entry for the same date (upsert logic)
    const lastWeight = await WeightModel.findOne(
      { user: userData._id, date: { $gte: today, $lt: tomorrow } },
      null,
      { session },
    );

    //const differenceBetweenLastAndNew = payload.weight - (lastWeight?.weight || 0);
    // Create or update the new weight entry for the day

    if (!Number(patientData.height)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Your height not found. Please update your profile first.",
      );
    }

    const weightPayload = {
      user: userData._id,
      weight: payload.weight,
      date: payload.date,
      notes: payload.notes,
      bmi: calculateBMI(payload.weight, Number(patientData.height)).toFixed(2),
    };

    const newWeight = await WeightModel.findOneAndUpdate(
      { user: userData._id, date: payload.date }, // Match by exact date and time
      weightPayload,
      { session, upsert: true, new: true },
    );

    // Recalculate daily, weekly, and monthly averages
    const dailyMeanWeight = await getDailyMeanWeight(userData._id, today, tomorrow);
    const lastWeekAvgWeight = await getWeeklyAvgWeight(userData._id, today);
    const lastMonthAvgWeight = await getMonthlyAvgWeight(userData._id, today);
    const avgWeight = await getOverallAvgWeight(userData._id);

    // Prepare payload for weight tracker
    //const weightTrackerPayload = {
    //  user: userData._id,
    //  avgWeight: avgWeight.length > 0 ? avgWeight[0].avgWeight : 0,
    //  weight_gain_today: differenceBetweenLastAndNew,
    //  weight_gain_week: lastWeekAvgWeight.length > 0 ? lastWeekAvgWeight[0].avgWeight : 0,
    //  weight_gain_month: lastMonthAvgWeight.length > 0 ? lastMonthAvgWeight[0].avgWeight : 0,
    //};

    // Update the WeightGainTrackerModel with new averages after the weight is created
    //await WeightGainTrackerModel.findOneAndUpdate({ user: userData._id }, weightTrackerPayload, {
    //  session,
    //  upsert: true,
    //  new: true,
    //});

    await session.commitTransaction();
    return newWeight;
  } catch (error: any) {
    await session.abortTransaction();
    console.error(error);
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  } finally {
    session.endSession();
  }
};

/***
 * 1. filter which patient need to get notification
 * 2 send notification using node cron job for sending notification every monday
 *
 */

//const createNotificationForWeight = async () => {
//  try {
//    const allWeights = await WeightModel.find({}).populate("tracker");
//    for (const weight of allWeights) {
//      const userData = await UserModel.findOne({ _id: weight.user }).lean();
//      const patient: TPatient = await PatientModel.findOne({ user: userData._id });
//      if (patient) {
//        if (patient.pregnancyType === "single") {
//          //Underweight BMI less than 18.5
//          //if (weight.bmi < 18.5) {
//          // weight 12.7-18.1 kilograms

//          //if (weight.bmi >= 12.7 && weight.bmi <= 18.1) {
//          // GET LAST MONDAY WEIGHT INFORMATION

//          const myConnectedDoctor = ConnectionModel.find({
//            patient: userData._id,
//            status: "accept",
//          }).lean();
//          console.log("Send Notification for Underweight");
//          const fcmToken = userData.fcmToken;
//          const title = "Underweight";
//          const body = `You are increasing more weight than expected per week`;

//          //TODO: NEED TO UNCOMMENT SEND NOTIFICATION FUNCTION & SEND NOTIFICATION FOR PATIENT AND DOCTOR BOTH

//          // get last week avg weight
//          const lastWeekAvgWeight = await getWeeklyAvgWeight(userData._id, new Date());
//          // get last second last week avg weight

//          if (lastWeekAvgWeight.length > 0) {
//            const lastWeekAvgWeightValue = lastWeekAvgWeight[0].avgWeight;
//            console.log(lastWeekAvgWeightValue, "lastWeekAvgWeightValue");
//          }
//          console.log({
//            //notificationPayload: { title, body, fcmToken },
//          });
//          //sendNotification([fcmToken], { title, body });
//        }
//      }
//      //Normal weight 18.5-24.9
//      if (weight.bmi < 12.7) {
//        if (weight.weight >= 11.3 && weight.weight <= 15.9) {
//          // TODO: SEND NOTIFICATION FOR PATIENT AND DOCTOR BOTH
//          //  }
//          //}
//          //const myConnectedDoctor = await ConnectionModel.find({
//          //  patient: userData._id,
//          //  status: "accept",
//          //})
//          //  .populate("doctor")
//          //  .lean();
//          ////console.log(myConnectedDoctor);
//          //myConnectedDoctor?.forEach(async (user: any) => {
//          //  if (user?.doctor?.fcmToken) {
//          //    const fcmToken = user?.doctor?.fcmToken;
//          //    const title = userData.name;
//          //    const body = `You are increasing more weight than expected per week`;
//          //    //console.log({ noficationPayload: { title, body, fcmToken } });
//          //    try {
//          //      //const result = await sendNotification([fcmToken], { title, body }).catch(err => {
//          //      //  console.log(err);
//          //      //});
//          //      //console.log(result);
//          //    } catch (error) {
//          //      console.log(error);
//          //    }
//          //    //console.log(result?.responses, "result");
//          //  }
//          //});
//          //console.log("Send Notification for Underweight");
//          //const fcmToken = userData.fcmToken;
//          //const title = "Underweight";
//          //const body = `You are increasing more weight than expected per week`;
//          //sendNotification([fcmToken], { title, body });
//        } else {
//          console.log("multiple");
//        }
//      } else {
//        console.log("patient not found");
//      }
//    }
//  } catch (error) {
//    console.log(error);
//  }
//};

const getWeightsFromDb = async (user: TTokenUser, query: Record<string, unknown>) => {
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

  // Check if the query contains a 'date' field and adjust it to filter by the entire day
  if (query?.date) {
    const inputDate = new Date(query.date as string);
    const startOfDay = new Date(
      inputDate.getUTCFullYear(),
      inputDate.getUTCMonth(),
      inputDate.getUTCDate(),
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(startOfDay.getUTCDate() + 1);

    // Replace the date in the query with the new date range
    query.date = {
      $gte: startOfDay,
      $lt: endOfDay,
    };
  }

  const weightQuery = new QueryBuilder(
    WeightModel,
    WeightModel.find({
      user: userData._id,
      ...(query?.date && { date: query.date }), // Filtering by the 'date' field
    }).populate("user tracker"),
    query,
  ).filter();

  const result = await weightQuery.modelQuery;
  return result;
};

const getWeeklyWeightDifference = async (userId: string, query: Record<string, unknown>) => {
  const userData = await UserModel.findOne({ _id: userId }).lean();
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
  // Retrieve all weight entries for the user, sorted by creation date (ascending)
  const weightEntries = await WeightModel.find({ user: userData._id })
    .sort({ createdAt: 1 }) // Sort by date in ascending order
    .lean();

  if (weightEntries.length < 1) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not enough data to calculate weight differences");
  }

  // Helper function to group weights by week
  const groupByWeek = (entries: any[]) => {
    const weeks = {};

    entries.forEach((entry) => {
      const week = moment(entry.createdAt).startOf("isoWeek").format("YYYY-WW"); // Get the week number
      if (!weeks[week]) {
        weeks[week] = [];
      }
      weeks[week].push(entry.weight);
    });

    return weeks;
  };

  // Group the weight entries by week
  const weeklyWeights = groupByWeek(weightEntries);

  // Calculate the weekly averages and sort by week
  const weeklyAverages = Object.keys(weeklyWeights)
    .map((week) => {
      const weights = weeklyWeights[week];
      const average = weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
      return {
        week,
        average,
      };
    })
    .sort((a, b) => moment(a.week, "YYYY-WW").diff(moment(b.week, "YYYY-WW"))); // Sort by week

  // Calculate the difference between weekly averages
  const weeklyDifferences = [];
  for (let i = 1; i < weeklyAverages.length; i++) {
    const previousWeek = weeklyAverages[i - 1];
    const currentWeek = weeklyAverages[i];
    const difference = currentWeek.average - previousWeek.average;

    weeklyDifferences.push({
      week: currentWeek.week,
      //average: currentWeek.average,
      difference,
    });
  }

  let result = weeklyDifferences;

  if (query.week) {
    const week = query.week;
    result = result.filter((item) => item.week === week);
  }

  return result;
};

//const getWeightsFromDb = async () => {
//  try {
//    // Get all weights and populate tracker data
//    const allWeights = await WeightModel.find({}).populate("tracker");
//    for (const weight of allWeights) {
//      // Get the user associated with the weight entry
//      const userData = await UserModel.findOne({ _id: weight.user }).lean();
//      const patient: TPatient = await PatientModel.findOne({ user: userData._id });

//      if (!patient) {
//        console.log("Patient not found for user:", userData._id);
//        continue;
//      }

//      const lastWeekInfo = await getDataBetweenLastAndSecondLastMonday(WeightGainTrackerModel);

//      // Calculate BMI and set the weight gain limits based on pregnancy type and BMI
//      let expectedGain = 0;
//      let alarmThreshold = 0;

//      if (patient.pregnancyType === "single") {
//        if (weight.bmi < 18.5) {
//          // Underweight BMI less than 18.5
//          expectedGain = 12.7;
//          alarmThreshold = 0.5; // Alarm if more than 0.5 kg increase per week
//        } else if (weight.bmi >= 18.5 && weight.bmi <= 24.9) {
//          // Normal weight BMI 18.5-24.9
//          expectedGain = 11.3;
//          alarmThreshold = 0.4; // Alarm if more than 0.4 kg increase per week
//        } else if (weight.bmi >= 25.0 && weight.bmi <= 29.9) {
//          // Overweight BMI 25.0-29.9
//          expectedGain = 6.8;
//          alarmThreshold = 0.3; // Alarm if more than 0.3 kg increase per week
//        } else if (weight.bmi >= 30.0 && weight.bmi <= 39.9) {
//          // Obese BMI 30.0-39.9
//          expectedGain = 5.0;
//          alarmThreshold = 0.25; // Alarm if more than 0.25 kg increase per week
//        }
//      } else if (patient.pregnancyType === "multiple") {
//        if (weight.bmi < 18.5) {
//          // Underweight BMI less than 18.5 (Twin pregnancy)
//          expectedGain = 22.7;
//          alarmThreshold = 0.7; // Alarm if more than 0.7 kg increase per week
//        } else if (weight.bmi >= 18.5 && weight.bmi <= 24.9) {
//          // Normal weight BMI 18.5-24.9 (Twin pregnancy)
//          expectedGain = 16.8;
//          alarmThreshold = 0.62; // Alarm if more than 0.62 kg increase per week
//        } else if (weight.bmi >= 25.0 && weight.bmi <= 29.9) {
//          // Overweight BMI 25.0-29.9 (Twin pregnancy)
//          expectedGain = 11.3;
//          alarmThreshold = 0.48; // Alarm if more than 0.48 kg increase per week
//        }
//      }

//      // Check weight difference between last week and the current week
//      if (lastWeekInfo && lastWeekInfo.avgWeight) {
//        const weightDifference = weight.weight - lastWeekInfo.avgWeight;

//        // Trigger an alarm if the weight difference exceeds the threshold
//        if (weightDifference > alarmThreshold) {
//          const myConnectedDoctor = await ConnectionModel.find({
//            patient: userData._id,
//            status: "accept",
//          }).lean();

//          // Send notification to the patient
//          const fcmToken = userData.fcmToken;
//          const title = "Weight Gain Alert";
//          const body = `You are increasing more weight than expected per week. Please consult your doctor.`;

//          // TODO: Uncomment and send notification to patient
//          console.log({
//            notificationPayload: { title, body, fcmToken },
//          });
//          // sendNotification([fcmToken], { title, body });

//          // Send notification to connected doctors
//          for (const doctorConnection of myConnectedDoctor) {
//            if (doctorConnection?.doctor) {
//              //const doctorFcmToken = doctorConnection?.doctor?.fcmToken;
//              const doctorTitle = `Patient: ${userData.name} Weight Gain Alert`;
//              const doctorBody = `${userData.name} has gained more weight than expected this week. Please review.`;

//              // TODO: Uncomment and send notification to the doctor
//              console.log({
//                //notificationPayload: { title: doctorTitle, body: doctorBody, doctorFcmToken },
//              });
//              // sendNotification([doctorFcmToken], { title: doctorTitle, body: doctorBody });
//            }
//          }
//        }
//      }
//    }
//  } catch (error) {
//    console.error("Error in createNotificationForWeight:", error);
//  }
//};

// Helper function to retrieve data between last Monday and the Monday before that

const getWeightDifferenceByDate = async (userId: string) => {
  // Fetch all weight records for the user, sorted by date

  const userData = await UserModel.findOne({ _id: userId }).lean();
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

  const weightEntries = await WeightModel.find({ user: userId }).sort({ date: 1 }).lean();

  if (!weightEntries || weightEntries.length === 0) {
    throw new Error("No weight entries found for the user.");
  }

  // Initialize array to store the results
  const dateDifferences = [];

  // Loop through the weight entries to calculate the difference between consecutive entries
  for (let i = 1; i < weightEntries.length; i++) {
    const previousEntry = weightEntries[i - 1];
    const currentEntry = weightEntries[i];

    // Calculate the difference in weight
    const weightDifference = currentEntry.weight - previousEntry.weight;

    // Calculate the difference in days between the dates
    const diffInDays = moment(currentEntry.date).diff(moment(previousEntry.date), "days");

    // Add the result to the array
    dateDifferences.push({
      previousDate: moment(previousEntry.date).format("YYYY-MM-DD"),
      currentDate: moment(currentEntry.date).format("YYYY-MM-DD"),
      weightDifference,
      diffInDays,
    });
  }

  return dateDifferences;
};

const calculateWeightDifference = async (userId: string, query: Record<string, unknown>) => {
  const userData = await UserModel.findOne({ _id: userId }).lean();
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

  const weightEntries = await WeightModel.find({ user: userData._id })
    .sort({ date: 1 }) // Sort by date in ascending order
    .lean();

  if (weightEntries.length < 2) {
    return [];
  }

  // Initialize an array to store the weight differences between consecutive entries
  const weightDifferences = [];

  // Loop through the entries and calculate the difference between each pair of consecutive entries
  for (let i = 1; i < weightEntries.length; i++) {
    const previousEntry = weightEntries[i - 1];
    const currentEntry = weightEntries[i];

    const weightDifference = currentEntry.weight - previousEntry.weight;

    weightDifferences.push({
      date: currentEntry.date, // Date of the current entry
      weightDifference, // Difference between the current and previous entry
    });
  }

  let result = [];
  if (query.date) {
    const date = new Date(query.date as string);
    result = weightDifferences.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  } else {
    result = weightDifferences;
  }

  return result;
};

const getLatestWeightDataFromDb = async (user: TTokenUser) => {
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

  const latestData = await WeightModel.aggregate([
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

//const createNotificationForWeight = async () => {
//  const today = moment();
//  const isMonday = today.day() === 1; // Check if today is Monday
// const secondLastMonday = moment().weekday(-13).startOf("day").utc(); // Previous Monday (start of day, in UTC)
//  const currentMonday = today.startOf("day").utc(); // Use today as current Monday (start of day, in UTC)

//  //if (!isMonday) {
//  //  console.log("Today is Monday, proceeding with aggregation");

//  //  // Get last Monday
//  //  const lastMonday = moment().weekday(-6).startOf("day").utc(); // Previous Monday (start of day, in UTC)
//  //  const currentMonday = today.startOf("day").utc(); // Use today as current Monday (start of day, in UTC)

//  //  const lastMondayInfo = await WeightModel.aggregate([
//  //    {
//  //      $match: {
//  //        date: {
//  //          $gte: lastMonday.toDate(), // Convert Moment to native Date object
//  //          $lt: currentMonday.toDate(), // Convert Moment to native Date object
//  //        },
//  //      },
//  //    },
//  //    {
//  //      $group: {
//  //        _id: null,
//  //        avgWeight: { $avg: "$weight" }, // Calculate average weight
//  //      },
//  //    },
//  //  ]);

//  //  // get last monday to second last monday
//  //  const secondLastMondayInfo = await WeightModel.aggregate([
//  //    {
//  //      $match: {
//  //        date: {
//  //          $gte: moment().weekday(-13).startOf("day").utc().toDate(), // From second last Monday (two weeks ago)
//  //          $lt: moment().weekday(-7).startOf("day").utc().toDate(), // Up to last Monday (one week ago)
//  //        },
//  //      },
//  //    },
//  //    {
//  //      $group: {
//  //        _id: null,
//  //        avgWeight: { $avg: "$weight" }, // Calculate average weight
//  //      },
//  //    },
//  //  ]);

//  //  //    Underweight BMI less than 18.5
//  //  //• 12.7-18.1 kilograms
//  //  //- If increase more than 0.5 kg between previous week and
//  //  //actual week an ALARM TO DOCTOR AND PATIENT should be
//  //  //displayed (you are increasing more weight than expected per
//  //  //week)

//  //  const underweightPatientList = await PatientModel.aggregate([
//  //    {
//  //      $match: {
//  //        $and: [
//  //          { isDelete: false },
//  //          { isActive: true },
//  //          {
//  //            $or: [{ pregnancyType: "single" }, { pregnancyType: "multiple" }],
//  //          },
//  //          //{
//  //          //  $or: [
//  //          //    { weight: { $lt: lastMondayInfo[0].avgWeight - 0.5 } },
//  //          //    { weight: { $lt: secondLastMondayInfo[0].avgWeight - 0.5 } },
//  //          //  ],
//  //          //},
//  //        ],
//  //      },
//  //    },
//  //    //{
//  //    //  $project: {
//  //    //    _id: 1,
//  //    //    user: 1,
//  //    //    name: 1,
//  //    //  },
//  //    //},
//  //  ]);

//  //  console.log({ underweightPatientList });
//  //} else {
//  //  console.log("Today is not Monday, no aggregation will be performed.");
//  //}

//  const combinedData = await PatientModel.aggregate([
//    {
//      $match: {
//        isActive: true,
//        isDelete: false,
//        $or: [{ pregnancyType: "single" }, { pregnancyType: "multiple" }],
//      },
//    },
//    {
//      $lookup: {
//        from: "weights", // Name of the 'WeightModel' collection in MongoDB
//        localField: "user", // The field in the PatientModel to match
//        foreignField: "user", // The field in the WeightModel to match
//        as: "weightData", // The name of the resulting field that will contain the weight data
//      },
//    },
//    {
//      $unwind: "$weightData", // Unwind the array to work with each weight record
//    },
//    {
//      $match: {
//        "weightData.date": {
//          $gte: secondLastMonday.toDate(), // Two weeks ago
//          $lt: currentMonday.toDate(), // Up to current Monday
//        },
//      },
//    },
//    {
//      $group: {
//        _id: "$_id", // Group by patient
//        avgWeight: { $avg: "$weightData.weight" }, // Calculate average weight for each patient
//        patient: { $first: "$$ROOT" }, // Keep patient info in the result
//      },
//    },
//    {
//      $project: {
//        _id: 1,
//        "patient.user": 1,
//        "patient.name": 1,
//        avgWeight: 1,
//      },
//    },
//  ]);
//  console.log(combinedData,"combine data");
//};

const createNotificationForWeight = async () => {
  const today = moment();
  const isMonday = today.day() === 1; // Check if today is Monday

  if (isMonday) {
    console.log("Proceeding with aggregation for alarming patients");
    // Get current Monday and last Monday
    const currentMonday = moment().day(1).startOf("day").utc(); // This week's Monday (start of day, in UTC)
    const lastMonday = moment(currentMonday).subtract(1, "weeks").startOf("day").utc(); // Last week's Monday
    const secondLastMonday = moment(currentMonday).subtract(2, "weeks").startOf("day").utc(); // Two weeks ago Monday

    // Combined aggregation with $lookup
    const combinedData = await PatientModel.aggregate([
      {
        $match: {
          isActive: true,
          isDelete: false,
        },
      },
      {
        $lookup: {
          from: "weights", // The 'WeightModel' collection in MongoDB
          localField: "user", // The field in the PatientModel
          foreignField: "user", // The field in the WeightModel
          as: "weightData", // The name of the resulting array with weight data
        },
      },
      {
        $unwind: "$weightData", // Unwind the array to handle individual weight records
      },
      {
        $match: {
          "weightData.date": {
            $gte: secondLastMonday.toDate(), // From two weeks ago
            $lt: currentMonday.toDate(), // Up to this Monday
          },
        },
      },
      {
        $group: {
          _id: "$_id", // Group by patient
          patient: { $first: "$$ROOT" }, // Keep patient information
          lastWeekWeight: {
            $max: {
              $cond: [
                { $gte: ["$weightData.date", lastMonday.toDate()] },
                "$weightData.weight",
                null,
              ],
            },
          }, // Get weight from last week
          secondLastWeekWeight: {
            $max: {
              $cond: [
                { $lt: ["$weightData.date", lastMonday.toDate()] },
                "$weightData.weight",
                null,
              ],
            },
          }, // Get weight from the week before last
        },
      },
      {
        $project: {
          "patient.user": 1,
          "patient.name": 1,
          "patient.bmi": 1,
          "patient.pregnancyType": 1,
          lastWeekWeight: 1,
          secondLastWeekWeight: 1,
          weightGain: {
            $subtract: ["$lastWeekWeight", "$secondLastWeekWeight"], // Calculate weight gain
          },
        },
      },
    ]);

    // Define the weight gain limits for different BMI categories and pregnancy types
    const weightGainLimits = {
      single: {
        underweight: { minGain: 12.7, maxGain: 18.1, threshold: 0.5 },
        normal: { minGain: 11.3, maxGain: 15.9, threshold: 0.4 },
        overweight: { minGain: 6.8, maxGain: 11.3, threshold: 0.3 },
        obese: { minGain: 5.0, maxGain: 9.1, threshold: 0.25 },
      },
      multiple: {
        underweight: { minGain: 22.7, maxGain: 28.1, threshold: 0.7 },
        normal: { minGain: 16.8, maxGain: 24.5, threshold: 0.62 },
        overweight: { minGain: 11.3, maxGain: 19.1, threshold: 0.48 },
      },
    };

    combinedData.forEach(async (patientData) => {
      const { patient, weightGain } = patientData;
      const bmi = patient.bmi;
      const pregnancyType = patient?.pregnancyType;

      let category: string;

      // Determine the BMI category for the patient
      //if (true) {
      if (bmi < 18.5) {
        category = "underweight";
      } else if (bmi >= 18.5 && bmi < 25.0) {
        category = "normal";
      } else if (bmi >= 25.0 && bmi < 30.0) {
        category = "overweight";
      } else if (bmi >= 30.0) {
        category = "obese";
      }

      // Get the weight gain limit based on the patient's BMI and pregnancy type
      const limits = weightGainLimits[pregnancyType][category];
      if (weightGain > limits?.threshold) {
        //if (true) {
        // If the weight gain exceeds the allowed threshold, trigger an alarm
        const userData = await UserModel.findOne({ _id: patient.user });

        const myConnectedDoctors = await ConnectionServices.getMyConnectionById(
          userData?._id.toString(),
        );

        const doctorFcmTokens = [];

        myConnectedDoctors.map(async (connection) => {
          const doctor = await UserModel.findById(connection?.doctor.toString());

          doctorFcmTokens.push(doctor?.fcmToken);
        });
        // Send notification to connected doctors

        if (userData.fcmToken) {
          const result = await sendNotification([userData?.fcmToken], {
            title: "ALARM",
            body: `you are increasing more weight than expected per week`,
            type: "weight",
            userId: userData?._id.toString(),
          });
        }
        if (doctorFcmTokens.length) {
          doctorFcmTokens.forEach(async (token) => {
            await sendNotification([token], {
              title: "ALARM",
              body: `you are increasing more weight than expected per week`,
              type: "weight",
              userId: userData?._id.toString(),
            });
          });
        }

        // Additional code to notify doctor and patient via Push Notification
        // Trigger permanent weight alert for patient and doctor
      }
    });
  } else {
    console.log("Today is not Monday, no aggregation will be performed.");
  }
};

export const WeightServices = {
  createWeightIntoDb,
  getWeightsFromDb,
  getLatestWeightDataFromDb,
  createNotificationForWeight,
  getWeeklyWeightDifference,
  calculateWeightDifference,
};
