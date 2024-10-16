import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TTokenUser } from "../../types/common";
import UserModel from "../user/user.model";
import { TConnectionStatus } from "./connection.interface";
import ConnectionModel from "./connection.model";
import mongoose from "mongoose";
import { ChatListServices } from "../chatList/chatList.service";

const createConnectionIntoDb = async (user: TTokenUser, payload: { doctorId: string }) => {
  const userData = await UserModel.findOne({ email: user.email, role: "patient" }).lean();
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
  }
  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }

  const doctorData = await UserModel.findOne({ _id: payload.doctorId, role: "doctor" }).lean();
  if (!doctorData) {
    throw new AppError(httpStatus.NOT_FOUND, "Doctor Not Found");
  }
  if (doctorData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
  }
  if (!doctorData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }
  const isAlreadyConnected = await ConnectionModel.findOne({
    patient: userData._id,
    doctor: doctorData._id,
  });

  if (isAlreadyConnected && isAlreadyConnected.status === "accept") {
    throw new AppError(httpStatus.BAD_REQUEST, "Already Connected");
  }

  if (isAlreadyConnected && isAlreadyConnected.status === "pending") {
    return isAlreadyConnected;
  }

  const result = await ConnectionModel.create({
    patient: userData._id,
    doctor: doctorData._id,
  });
  return result;
};

//  FOR DOCTOR
const getConnectionRequestFromDb = async (user: TTokenUser, query: Record<string, unknown>) => {
  const userData = await UserModel.findOne({ email: user.email, role: "doctor" }).lean();
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
  }
  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }
  const connectionQuery = new QueryBuilder(
    ConnectionModel,
    ConnectionModel.find({
      doctor: userData._id,
    }).populate("patient doctor"),
    query,
  )
    .search(["patient", "doctor"], {
      lookupFrom: "users",
      localField: "patient",
      foreignField: "_id",
      lookupAs: "patient",
    })
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await connectionQuery.modelQuery;

  return result;
};

// FOR PATIENT
const getMyConnectionRequest = async (user: TTokenUser, query: Record<string, unknown>) => {
  const userData = await UserModel.findOne({ email: user.email, role: "patient" }).lean();
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
  }
  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }
  const connectionQuery = new QueryBuilder(
    ConnectionModel,
    ConnectionModel.find({
      patient: userData._id,
    }).populate("patient doctor"),
    query,
  )
    .search(["doctor patient"], {
      lookupFrom: "users",
      localField: "doctor",
      foreignField: "_id",
      lookupAs: "doctor",
    })
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await connectionQuery.modelQuery;
  return result;
};

const updateConnectionStatusIntoDb = async (
  user: TTokenUser,
  connectionId: string,
  payload: { status: TConnectionStatus },
) => {
  const userData = await UserModel.findOne({ email: user.email, role: "doctor" }).lean();
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
  }

  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }

  const connectionData = await ConnectionModel.findOne({
    _id: connectionId,
    doctor: userData._id,
  });
  if (!connectionData) {
    throw new AppError(httpStatus.NOT_FOUND, "Connection Not Found");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await ConnectionModel.findOneAndUpdate(
      {
        _id: connectionId,
        doctor: userData._id,
      },
      {
        status: payload.status,
      },
      {
        new: true,
        runValidators: true,
      },
    ).session(session);

    // after accept the connection create a chat list
    if (payload.status === "accept") {
      await ChatListServices.createChatListIntoDb(user, {
        participants: [connectionData.patient.toString()],
      });
    }

    await session.commitTransaction();
    session.endSession();

    return result;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.log(error, "error");
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const cancelConnectionIntoDb = async (user: TTokenUser, payload: { connectionId: string }) => {
  const userData = await UserModel.findOne({ email: user.email, role: "patient" }).lean();
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
  }
  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }

  const result = await ConnectionModel.findOneAndDelete({
    _id: payload.connectionId,
    patient: userData._id,
  });
  return result;
};

const getMyConnectionById = async (userId: string) => {
  const userData = await UserModel.findOne({ _id: userId }).lean();
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
  }
  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }

  if (!userData.validation?.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Your Account is not verified");
  }

  const result = await ConnectionModel.find({
    $or: [{ patient: userId }, { doctor: userId }],
  }).populate("patient doctor");

  return result;
};

export const ConnectionServices = {
  createConnectionIntoDb,
  updateConnectionStatusIntoDb,
  cancelConnectionIntoDb,
  getConnectionRequestFromDb,
  getMyConnectionRequest,
  getMyConnectionById,
};
