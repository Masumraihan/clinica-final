import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { HealthRecordServices } from "./healthRecord.service";
import { CustomRequest } from "../../types/common";

const uploadHealthRecord = catchAsync(async (req, res) => {
    const user = (req as CustomRequest).user
    const result = await HealthRecordServices.uploadHealthRecordIntoDb(user,req.body);
    sendResponse(req,res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Health record uploaded successfully',
        data:result
      });
})

const getHealthRecord = catchAsync(async (req, res) => {
    const user = (req as CustomRequest).user
    const result = await HealthRecordServices.getHealthRecordFromDb(user);
    sendResponse(req,res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Health record fetched successfully',
        data:result
      });
})


export const HealthRecordControllers = {
    uploadHealthRecord,
    getHealthRecord
}