import httpStatus from "http-status";
import { CustomRequest } from "../../types/common";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { GlucoseServices } from "./glucose.service";

const createGlucose = catchAsync(async(req,res) => {
    const user = (req as CustomRequest).user
    const result = await GlucoseServices.createGlucoseIntoDb(user,req.body);
    sendResponse(req,res,{
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Glucose created successfully",
        data: result
    })
})

const getGlucose = catchAsync(async(req,res) => {
    const user = (req as CustomRequest).user
    const result = await GlucoseServices.getGlucoseFromDb(user,req.query);
    sendResponse(req,res,{
        statusCode: httpStatus.OK,
        success: true,
        message: "Glucose fetched successfully",
        data: result
    });
})


const getLatestGlucoseData = catchAsync(async(req,res) => {
    const user = (req as CustomRequest).user
    const result = await GlucoseServices.getLatestGlucoseDataFromDb(user);
    sendResponse(req,res,{
        statusCode: httpStatus.OK,
        success: true,
        message: "Glucose fetched successfully",
        data: result
    });
})

export const GlucoseControllers = {
    createGlucose,
    getGlucose,
    getLatestGlucoseData
}