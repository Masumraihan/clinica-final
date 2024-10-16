import httpStatus from "http-status";
import { CustomRequest } from "../../types/common";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ConnectionServices } from "./connection.service";

const createConnection = catchAsync(async (req, res) => {
    const user = (req as CustomRequest).user;
    const result = await ConnectionServices.createConnectionIntoDb(user, req.body);
    sendResponse(req, res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Connection created successfully',
        data: result
    });
})

// FOR DOCTOR
const getConnectionRequest = catchAsync(async (req, res) => {
    const user = (req as CustomRequest).user;
    const result = await ConnectionServices.getConnectionRequestFromDb(user, req.query);
    sendResponse(req, res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Connection request fetched successfully',
        data: result
    });
})

// FOR PATIENT
const getConnection = catchAsync(async (req, res) => {
    const user = (req as CustomRequest).user;
    const result = await ConnectionServices.getMyConnectionRequest(user, req.query);
    sendResponse(req, res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Connection fetched successfully',
        data: result
    });
})

const updateConnection = catchAsync(async (req, res) => {
    const user = (req as CustomRequest).user;
    const result = await ConnectionServices.updateConnectionStatusIntoDb(user, req.params.connectionId, req.body);
    sendResponse(req, res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Connection updated successfully',
        data: result
    });
})

const cancelConnection = catchAsync(async (req, res) => {
    const user = (req as CustomRequest).user;
    const result = await ConnectionServices.cancelConnectionIntoDb(user, req.body);
    sendResponse(req, res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Connection canceled successfully',
        data: result
    });
})


export const ConnectionController = {
    createConnection,
    updateConnection,
    cancelConnection,
    getConnection,
    getConnectionRequest
}