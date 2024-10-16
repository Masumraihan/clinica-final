import httpStatus from "http-status";
import { CustomRequest } from "../../types/common";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { WeightServices } from "./weight.service";

const createWeight = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await WeightServices.createWeightIntoDb(user, req.body);
  sendResponse(req, res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Weight created successfully",
    data: result,
  });
});

const getWeights = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await WeightServices.getWeightsFromDb(user, req.query);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Weights fetched successfully",
    data: result,
  });
});

const getLatestWeightData = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await WeightServices.getLatestWeightDataFromDb(user);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Latest Weight fetched successfully",
    data: result,
  });
});

const getWeeklyWeightDifference = catchAsync(async (req, res) => {
  const result = await WeightServices.getWeeklyWeightDifference(req.params.id, req.query);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Weekly Weight Difference fetched successfully",
    data: result,
  });
});

const calculateWeightDifference = catchAsync(async (req, res) => {
  const result = await WeightServices.calculateWeightDifference(req.params.id, req.query);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Weight Difference calculated successfully",
    data: result,
  });
});

export const WeightControllers = {
  createWeight,
  getWeights,
  getLatestWeightData,
  getWeeklyWeightDifference,
  calculateWeightDifference,
};
