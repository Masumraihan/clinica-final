import { Server as HttpServer } from "http";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import AppError from "./app/errors/AppError";
import { TChatList } from "./app/modules/chatList/chatList.interface";
import ChatListModel from "./app/modules/chatList/chatList.model";
import { ChatListServices } from "./app/modules/chatList/chatList.service";
import MessageModel from "./app/modules/massage/message.model";
import { MessageServices } from "./app/modules/massage/message.service";
import { TUser } from "./app/modules/user/user.interface";
import UserModel from "./app/modules/user/user.model";
import { TTokenUser } from "./app/types/common";
import config from "./app/config";
import { checkUser } from "./app/utils/checkUser";

const initializeSocketIO = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // Online users
  const onlineUser = new Set();

  io.on("connection", async (socket) => {
    console.log("connected", socket?.id);
    try {
      //----------------------user token get from front end-------------------------//
      const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
      //----------------------check Token and return user details-------------------------//

      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, "No token provided");
        //return false;
      }

      console.log({ token });

      let user: TTokenUser | null = null;
      try {
        user = jwt.verify(token, config?.jwt_access_secret || "your_secret_key") as TTokenUser;
      } catch (error) {
        console.log(error);
        //throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token");
      }

      try {
        checkUser(token);
      } catch (error) {
        console.log(error);
      }
      if (!user) {
        //throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token");
        return false;
      }
      const userData = {
        _id: user._id,
      };

      socket.join(userData?._id?.toString());
      //socket.emit("online-user-list", {});

      //----------------------user id set in online array-------------------------//
      onlineUser.add(userData?._id?.toString());

      socket.on("check", (data, callback) => {
        //console.log(data);
        callback({ success: true });
      });

      //----------------------online array send for front end------------------------//
      io.emit("onlineUser", Array.from(onlineUser));

      socket.on("online-user-list", async (data, callback) => {
        try {
          const onlineUserList = await UserModel.find({
            _id: { $all: Array.from(onlineUser) },
          });

          //console.log(onlineUserList);

          callback({ success: true, data: onlineUserList });
        } catch (error: any) {
          console.log(error);
          callback({ success: false, message: error.message });
        }
      });

      //----------------------user details and messages send for front end -->(as need to use)------------------------//
      socket.on("message-page", async ({ receiverId }, callback) => {
        if (!receiverId) {
          callback({ success: false, message: "receiverId is required" });
        }

        //console.log(receiverId, "receiverId");
        //console.log(userData?._id, "userData?._id");

        try {
          const receiverDetails: TUser = await UserModel.findById(receiverId).select(
            "_id email role profilePicture name slug contact",
          );

          if (!receiverDetails) {
            callback({
              success: false,
              message: "user is not found!",
            });
            io.emit("io-error", {
              success: false,
              message: "user is not found!",
            });
          }

          //const payload = {
          //  _id: receiverDetails?._id,
          //  email: receiverDetails?.email,
          //  profilePicture: receiverDetails?.profilePicture,
          //  role: receiverDetails?.role,
          //  name: receiverDetails.name,
          //};

          const getPreMessage = await MessageModel.find({
            $or: [
              {
                sender: userData?._id,
                receiver: receiverId,
              },
              {
                sender: receiverId,
                receiver: userData?._id,
              },
            ],
          }).sort({ updatedAt: 1 });

          socket.emit("message", { data: getPreMessage || [] });
          if (callback) {
            callback({ success: true, data: getPreMessage || [] });
          }
        } catch (error: any) {
          callback({
            success: false,
            message: error.message,
          });
          io.emit("io-error", { success: false, message: error.message });
          console.error("Error in message-page event:", error);
        }
      });
      //----------------------chat list------------------------//
      socket.on("my-chat-list", async ({}, callback) => {
        try {
          const chatList = await ChatListServices.getMyChatListFromDb(userData._id);
          const myChat = "chat-list::" + userData?._id;
          socket.emit(myChat, { data: chatList });
          callback({ success: true, message: "Get chat list Successfully", data: chatList });
        } catch (error: any) {
          callback({
            success: false,
            message: error.message,
          });
          io.emit("io-error", { success: false, message: error.message });
        }
      });
      //----------------------send message-----------------------
      socket.on("send-message", async ({ receiverId, text, file }, callback) => {
        if (!receiverId)
          return callback({ success: false, message: "Receiver ID and text are required" });

        try {
          let chatList = await ChatListModel.findOne({
            //  FIND CHAT LIST WHERE IS USER AND RECEIVER EXIST
            participants: { $all: [userData._id, receiverId] },
          });

          if (!chatList) {
            //  IF CHAT LIST IS NOT EXIST CREATE A NEW CHAT LIST FOR SENDER AND RECEIVER
            chatList = await ChatListServices.createChatListIntoDb(user, {
              participants: [receiverId],
            });
          }

          const message = await MessageModel.create({
            sender: userData._id,
            receiver: receiverId,
            chat: chatList._id,
            text,
            file,
          });

          io.emit("new-message::" + receiverId, message);
          io.emit("new-message::" + userData._id, message);

          const getPreMessage = await MessageModel.find({
            $or: [
              {
                sender: userData?._id,
                receiver: receiverId,
              },
              {
                sender: receiverId,
                receiver: userData?._id,
              },
            ],
          }).sort({ updatedAt: 1 });

          const senderMessage = "message::" + userData._id;
          const receiverMessage = "message::" + receiverId;

          io.emit(senderMessage, { data: getPreMessage || [] });
          io.emit(receiverMessage, { data: getPreMessage || [] });

          //socket.emit("message", { data: getPreMessage } || []);

          //  NEED TO INFORM RECEIVER OR SENDER FOR UPDATE THE CHAT LIST

          const ChatListUser1 = await ChatListServices.getMyChatListFromDb(userData._id.toString());

          const ChatListUser2 = await ChatListServices.getMyChatListFromDb(receiverId);

          const user1Chat = "chat-list::" + userData._id;

          const user2Chat = "chat-list::" + receiverId;

          io.emit(user1Chat, { data: ChatListUser1 });
          io.emit(user2Chat, { data: ChatListUser2 });

          // Send the message to both sender and receiver
          //io.to(receiverId).emit("receive-message", message);
          //io.to(userData._id.toString()).emit("receive-message", message);
          callback({ success: true, message });
        } catch (error: any) {
          callback({ success: false, message: error.message });
        }
      });

      //----------------------seen message-----------------------//
      socket.on("seen", async ({ chatId }, callback) => {
        if (!chatId) {
          callback({
            success: false,
            message: "chatId id is required",
          });

          io.emit("io-error", {
            success: false,
            message: "chatId id is required",
          });
        }

        try {
          const chatList: TChatList | null = await ChatListModel.findById(chatId);
          if (!chatList) {
            callback({
              success: false,
              message: "chat id is not valid",
            });
            io.emit("io-error", {
              success: false,
              message: "chat id is not valid",
            });
            throw new AppError(httpStatus.BAD_REQUEST, "chat id is not valid");
          }

          const messageIdList = await MessageModel.aggregate([
            {
              $match: {
                chat: chatList._id,
                seen: false,
                sender: { $ne: userData?._id },
              },
            },
            { $group: { _id: null, ids: { $push: "$_id" } } },
            { $project: { _id: 0, ids: 1 } },
          ]);

          const unseenMessageIdList = messageIdList.length > 0 ? messageIdList[0].ids : [];

          // Update the unseen messages to seen
          const updateMessages = await MessageModel.updateMany(
            { _id: { $in: unseenMessageIdList } },
            { $set: { seen: true } },
          );

          const user1 = chatList.participants[0];
          const user2 = chatList.participants[1];

          //----------------------ChatList------------------------//
          const ChatListUser1 = await ChatListServices.getMyChatListFromDb(user1.toString());

          const ChatListUser2 = await ChatListServices.getMyChatListFromDb(user2.toString());

          const user1Chat = "chat-list::" + user1.toString();
          const user2Chat = "chat-list::" + user2.toString();

          io.emit(user1Chat, { data: ChatListUser1 });
          io.emit(user2Chat, { data: ChatListUser2 });

          // new

          //const getPreMessage = await MessageModel.find({
          //  $or: [
          //    {
          //      sender: user1.toString(),
          //      receiver: user2.toString(),
          //    },
          //    {
          //      sender: user1.toString(),
          //      receiver: user2.toString(),
          //    },
          //  ],
          //}).sort({ updatedAt: 1 });

          //const senderMessage = "message::" + user1.toString();
          //const receiverMessage = "message::" + user2.toString();

          //io.emit(senderMessage, { data: getPreMessage } || []);
          //io.emit(receiverMessage, { data: getPreMessage } || []);
        } catch (error: any) {
          callback({
            success: false,
            message: error.message,
          });
          console.error("Error in seen event:", error);
          socket.emit("error", { message: error.message });
        }
      });

      socket.on("chat-list", async ({ chatId }, callback) => {
        if (!chatId) {
          callback({
            success: false,
            message: "Please provide Chat Id",
          });
        }
        const result = MessageServices.getMessagesFromDb(user, chatId);
        callback({
          success: true,
          message: "Messages get successfully",
          data: result,
        });
      });

      //-----------------------Disconnect------------------------//
      socket.on("disconnect", () => {
        onlineUser.delete(userData?._id?.toString());
        io.emit("online-user-list", Array.from(onlineUser));
        console.log("disconnect user ", socket.id);
      });
    } catch (error: any) {
      console.error("-- socket.io connection error --", error);
      //socket.emit("error", { message: error.message });
    }
  });

  return io;
};

export default initializeSocketIO;
