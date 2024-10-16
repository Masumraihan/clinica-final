import catchAsync from "../../utils/catchAsync";
import { MessageServices } from "./message.service";
import { CustomRequest } from "../../types/common";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";

const createMessage = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await MessageServices.createMessageIntoDb(user, req.body);
  sendResponse(req, res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Message created successfully",
    data: result,
  });
});

const getMessages = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await MessageServices.getMessagesFromDb(user, req.params.chatId);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages fetched successfully",
    data: result,
  });
});

const getMessageByReceiver = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await MessageServices.getMessageByReceiverFromDb(user, req.params.receiverId);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages fetched successfully",
    data: result,
  });
});

const seenMessage = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await MessageServices.seenMessageIntoDb(user, req.params.chatId);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Messages fetched successfully",
    data: result,
  });
});

export const MessageControllers = {
  createMessage,
  getMessages,
  getMessageByReceiver,
  seenMessage,
};
