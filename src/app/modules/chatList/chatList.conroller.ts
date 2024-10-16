import catchAsync from "../../utils/catchAsync";
import { ChatListServices } from "./chatList.service";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { CustomRequest } from "src/app/types/common";

const createChatList = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ChatListServices.createChatListIntoDb(user, req.body);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat list created successfully",
    data: result,
  });
});

const getChatList = catchAsync(async (req, res) => {
  const user = (req as CustomRequest).user;
  const result = await ChatListServices.getChatListFromDb(user, req.query);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat list fetched successfully",
    data: result,
  });
});

const deleteUserFromChatList = catchAsync(async (req, res) => {
  const userId = req.params.userId;
  const user = (req as CustomRequest).user;
  const result = await ChatListServices.deleteUserFromChatList(user, userId);
  sendResponse(req, res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chat list added successfully",
    data: result,
  });
});

export const ChatListController = {
  createChatList,
  getChatList,
  deleteUserFromChatList,
};
