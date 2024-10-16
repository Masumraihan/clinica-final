import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { TTokenUser } from "../../types/common"
import { THealthRecord } from "./healthRecord.interface"
import UserModel from "../user/user.model";
import { HealthRecordModel } from "./healthRecord.model";

// const uploadHealthRecordIntoDb = async (user:TTokenUser,healthRecordFile:THealthRecord) => {

//     if (!healthRecordFile.file) {
//         throw new AppError(httpStatus.BAD_REQUEST, "File is required");
//     }

//     const userData = await UserModel.findOne({ email: user.email }).lean();
//   if (!userData) {
//     throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
//   }
//   if (!userData.isActive) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
//   }
//   if (userData.isDelete) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
//   }
//   if (!userData.validation?.isVerified) {
//     throw new AppError(httpStatus.BAD_REQUEST, "Your Account is not verified");
//   }

//   const healthRecord = await HealthRecordModel.create({
//     user: userData._id,
//     file: healthRecordFile.file
//   });
//   return healthRecord
// }

const uploadHealthRecordIntoDb = async (user: TTokenUser, healthRecordFiles: { files: string[] }) => {
    // Check if the healthRecordFiles array contains any files
    if (!healthRecordFiles || healthRecordFiles?.files.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "At least one file is required");
    }

    // Find the user in the database by email
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


    console.log(healthRecordFiles,"file")

    // Loop through each file and create a health record for it
    const healthRecords = await Promise.all(
        healthRecordFiles?.files.map(async (file) => {
            const healthRecord = await HealthRecordModel.create({
                user: userData._id,
                file
            });
            return healthRecord;
        })
    );

    return healthRecords;
};


const getHealthRecordFromDb = async (user:TTokenUser) => {
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

    const healthRecord = await HealthRecordModel.find({user:userData._id});
    return healthRecord
}


export const HealthRecordServices = {
    uploadHealthRecordIntoDb,
    getHealthRecordFromDb
}