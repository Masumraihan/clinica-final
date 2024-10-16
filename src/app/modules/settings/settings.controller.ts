import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import { SettingsServices } from "./settings.service";
import catchAsync from "../../utils/catchAsync";

const createSettings = catchAsync(async (req, res) => {
    const result = await SettingsServices.createSettingsIntoDb(req.body);
    sendResponse(req, res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Settings created successfully",
        data: result,
    });
})

const getSettings = catchAsync(async (req, res) => {
    const result = await SettingsServices.getSettingsFromDb();
    sendResponse(req, res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Settings fetched successfully",
        data: result,
    });
})

const updateSettings = catchAsync(async (req, res) => {
    const result = await SettingsServices.updateSettingsIntoDb(req.body);
    sendResponse(req, res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Settings updated successfully",
        data: result,
    });
})


export const SettingsControllers = {
    createSettings,
    updateSettings,
    getSettings
}