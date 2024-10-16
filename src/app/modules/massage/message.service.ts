import { TTokenUser } from "src/app/types/common";
import { TMessage } from "./message.interface";
import AppError from "../../errors/AppError";
import UserModel from "../user/user.model";
import httpStatus from "http-status";
import MessageModel from "./message.model";
import { ChatListServices } from "../chatList/chatList.service";
import { Schema, Types } from "mongoose";
import { TChatList } from "../chatList/chatList.interface";
import ChatListModel from "../chatList/chatList.model";

const createMessageIntoDb = async (user: TTokenUser, payload: TMessage) => {
  const userData = await UserModel.findOne({ email: user.email });
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

  const receiverData = await UserModel.findOne({ _id: payload.receiver }).lean();
  if (!receiverData) {
    throw new AppError(httpStatus.NOT_FOUND, "Receiver Not Found");
  }
  if (!receiverData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Receiver Account is Blocked");
  }
  if (receiverData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Receiver Account is Deleted");
  }
  if (!receiverData.validation?.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Receiver Account is not verified");
  }

  const isAlreadyExist = await MessageModel.findOne({
    $or: [
      { sender: userData._id, receiver: receiverData._id },
      { sender: receiverData._id, receiver: userData._id },
    ],
  });

  const data: any = {
    participants: [
      { user: userData._id as Schema.Types.ObjectId },
      { user: receiverData._id as Schema.Types.ObjectId },
    ],
  };

  if (!isAlreadyExist) {
    const result = await ChatListServices.createChatListIntoDb(user, data);
    if (!result) {
      throw new AppError(httpStatus.BAD_REQUEST, "Chat creation failed");
    }
  }

  const result = await MessageModel.create({
    sender: userData._id,
    receiver: receiverData._id,
    chat: payload.chat,
    text: payload.text,
    file: payload.file,
  });

  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, "Message creation failed");
  }
  const io = global.socketio;

  if (io) {
    const senderMessage = "new-message::" + result.chat.toString();

    const chatList = await ChatListServices.getChatListByUserId(userData._id.toString());
    const lastMessage = await MessageModel.findOne({ chat: result.chat }).sort({ createdAt: -1 });
    const unseenMessageCount = await MessageModel.countDocuments({
      chat: result.chat,
      seen: false,
      sender: { $ne: userData._id },
    });

    const formattedResponse = {
      chatList,
      lastMessage,
      unseenMessageCount,
    };

    io.emit(senderMessage, formattedResponse);

    const ChatListSender = await ChatListServices.getMyChatListFromDb(result?.sender.toString());
    const ChatListReceiver = await ChatListServices.getMyChatListFromDb(
      result?.receiver.toString(),
    );

    const senderChat = "chat-list::" + result.sender.toString();
    const receiverChat = "chat-list::" + result.receiver.toString();
    io.emit(receiverChat, ChatListSender);
    io.emit(senderChat, ChatListReceiver);
  }
  return result;

  // const message = await MessageModel.create({...payload,sender:userData._id,receiver:receiverData._id});
  // return message;
};

const getMessagesFromDb = async (user: TTokenUser, chatId: string) => {
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

  const messages = await MessageModel.find({
    $or: [{ sender: userData._id }, { receiver: userData._id }],
    chat: chatId,
  });
  return messages;
};

const getMessageByReceiverFromDb = async (user: TTokenUser, receiverId: string) => {
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

  const messages = await MessageModel.find({
    $or: [{ sender: userData._id }, { receiver: receiverId }],
  }).populate({
    path: "sender receiver",
    select: "name profilePicture email",
    match: { _id: { $ne: userData._id } },
  });
  return messages;
};
// Ensure you have this import

const seenMessageIntoDb = async (user: TTokenUser, chatId: string) => {
  // Find the current user
  const userData = await UserModel.findOne({ email: user.email }).lean();
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Convert chatId to ObjectId if it's a string
  const chatObjectId = new Types.ObjectId(chatId);

  const chat = await ChatListModel.findOne({ _id: chatObjectId }).lean();
  if (!chat) {
    throw new AppError(httpStatus.NOT_FOUND, "Chat not found");
  }

  // Aggregate unseen messages
  const messageIdList = await MessageModel.aggregate([
    {
      $match: {
        chat: chatObjectId, // Ensure chatId is matched as ObjectId
        seen: false, // Find messages that are not yet seen
        sender: { $ne: userData._id }, // Exclude messages sent by the current user
      },
    },
    { $group: { _id: null, ids: { $push: "$_id" } } },
    { $project: { _id: 0, ids: 1 } },
  ]);

  // Extract message IDs that are unseen
  const unseenMessageIdList = messageIdList.length > 0 ? messageIdList[0].ids : [];

  // Update all unseen messages to mark them as seen
  const updateMessages = await MessageModel.updateMany(
    { _id: { $in: unseenMessageIdList } },
    { $set: { seen: true } },
  );

  return updateMessages;
};

export const MessageServices = {
  createMessageIntoDb,
  getMessagesFromDb,
  getMessageByReceiverFromDb,
  seenMessageIntoDb,
};
