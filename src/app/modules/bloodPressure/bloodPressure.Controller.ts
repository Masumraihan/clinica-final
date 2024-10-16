import httpStatus from "http-status";
import { CustomRequest } from "../../types/common";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { BloodPressureServices } from "./bloodPressure.service";

const createBloodPressure = catchAsync(async(req,res) => {
    const user = (req as CustomRequest).user
    const result = await BloodPressureServices.createBloodPressureIntoDb(user,req.body);
    sendResponse(req,res,{
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Blood Pressure created successfully",
        data: result
    })
})

const getBloodPressures = catchAsync(async(req,res) => {
    const user = (req as CustomRequest).user
    const result = await BloodPressureServices.getBloodPressuresFromDb(user,req.query);
    sendResponse(req,res,{
        statusCode: httpStatus.OK,
        success: true,
        message: "Blood Pressures fetched successfully",
        data: result
    })
})

const getLatestBloodPressureData = catchAsync(async(req,res) => {
    const user = (req as CustomRequest).user
    const result = await BloodPressureServices.getLatestBloodPressureDataFromDb(user);
    sendResponse(req,res,{
        statusCode: httpStatus.OK,
        success: true,
        message: "Latest Blood Pressure fetched successfully",
        data: result
    })
})

export const BloodPressureControllers = {
    createBloodPressure,
    getBloodPressures,
    getLatestBloodPressureData
}