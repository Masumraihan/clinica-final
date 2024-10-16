import { generateSlug } from "../../utils/generateSlug";
import { TDoctor } from "./doctor.interface";
import DoctorModel from "./doctor.model";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import mongoose from "mongoose";
import UserModel from "../user/user.model";
import config from "../../config";
import AppError from "../../errors/AppError";
import moment from "moment";
import path from "path";
import fs from "fs";
import { sendMail } from "../../utils/sendMail";
import { createToken } from "../auth/auth.utils";
import { TUser } from "../user/user.interface";
import { TTokenUser } from "../../types/common";
import QueryBuilder from "../../builder/QueryBuilder";

const createDoctorFromDb = async (payload: TDoctor & TUser) => {
  const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));
  payload.password = hashedPassword;
  const slug = generateSlug(payload.name);
  payload.slug = slug;
  const session = await mongoose.startSession();

  const userPayload = {
    name: payload.name,
    email: payload.email,
    slug: payload.slug,
    profilePicture: payload.profilePicture,
    contact: payload.contact,
    password: payload.password,
    role: "doctor",
    gender: payload.gender,
    validation: { isVerified: false, expiry: null, otp: null },
  };

  try {
    session.startTransaction();

    // Create User document
    const user = await UserModel.create([userPayload], { session });

    // Retrieve the created User document
    const userData = await UserModel.findOne({ email: payload.email }).session(session);
    if (!userData) {
      throw new AppError(httpStatus.NOT_FOUND, "Invalid Email");
    }

    // Create doctor document
    const doctorPayload = {
      address: payload.address,
      about: payload.about,
      dob: payload.dob,
      experience: payload.experience,
      title: payload.title,
      slug: userData.slug,
      user: userData._id,
    };

    const doctor = await DoctorModel.create(
      [
        {
          ...doctorPayload,
          user: userData._id,
          slug: userData.slug,
        },
      ],
      { session },
    );

    //  SEND EMAIL FOR VERIFICATION
    const otp = Math.floor(100000 + Math.random() * 900000);
    const currentTime = new Date();
    // generate token
    const expiresAt = moment(currentTime).add(3, "minute");

    await UserModel.findOneAndUpdate(
      { email: userData.email },
      { validation: { isVerified: false, otp, expiry: expiresAt.toString() } },
      { session },
    );

    const parentMailTemplate = path.join(process.cwd(), "/src/template/verify.html");
    const forgetOtpEmail = fs.readFileSync(parentMailTemplate, "utf-8");
    const html = forgetOtpEmail
      .replace(/{{name}}/g, userData.name)
      .replace(/{{otp}}/g, otp.toString());
    const info = await sendMail({
      to: userData.email,
      html,
      subject: "Verify Your Account From Clinica",
    });

    // after send verification email put the otp into db
    const jwtPayload = { email: userData.email, role: userData.role };
    const token = createToken(
      jwtPayload,
      config.jwt_reset_secret as string,
      config.jwt_reset_token_expire_in as string,
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    return {
      token,
    };
  } catch (error: any) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getDoctorsFromDb = async (query: Record<string, unknown>) => {
  const userFields = (query?.userFields as string)?.split(",").join(" ");

  if (query?.userFields) {
    delete query.userFields;
  }

  const doctorQuery = new QueryBuilder(
    DoctorModel,
    DoctorModel.find().populate({ path: "user", select: userFields }),
    query,
  )
    .search(["slug", "title", "experience", "address", "about"], {
      lookupFrom: "users",
      localField: "user",
      foreignField: "_id",
      lookupAs: "user",
    })
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await doctorQuery.modelQuery;
  const meta = await doctorQuery.countTotal();

  return { meta, data: result };
};

const getSingleDoctorFromDb = async (slug: string) => {
  const doctor = await DoctorModel.findOne({ slug }).populate("user");
  return doctor;
};

const getProfileFromDb = async (user: TTokenUser) => {
  const userData = await UserModel.findOne({ email: user.email });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "Invalid Email");
  }
  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }
  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Deleted");
  }

  const profile = await DoctorModel.findOne({ user: userData._id }).lean();
  return {
    ...profile,
    user: userData,
  };
};

const updateDoctorByAdmin = async (userId: string, payload: Partial<TDoctor> & Partial<TUser>) => {
  const userUpdatedData: Partial<TUser> = {};

  const { name, email, profilePicture, contact, password, role, gender, ...patientUpdatedData } =
    payload;
  if (name) {
    const slug = generateSlug(name);
    userUpdatedData.name = name;
    userUpdatedData.slug = slug;
    patientUpdatedData.slug = slug;
  }
  if (email) userUpdatedData.email = email;
  if (profilePicture) userUpdatedData.profilePicture = profilePicture;
  if (contact) userUpdatedData.contact = contact;
  if (role) userUpdatedData.role = role;
  if (gender) userUpdatedData.gender = gender;

  const userData = await UserModel.findById(userId);
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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await UserModel.findByIdAndUpdate(userId, userUpdatedData, { session });
    await DoctorModel.findOneAndUpdate({ user: userData._id }, patientUpdatedData, { session });
    await session.commitTransaction();
    session.endSession();
    return {
      ...patientUpdatedData,
      user: userUpdatedData,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const updateDoctorIntoDb = async (user: TTokenUser, payload: Partial<TDoctor> & Partial<TUser>) => {
  const userUpdatedData: Partial<TUser> = {};

  const { name, email, profilePicture, contact, password, role, gender, ...patientUpdatedData } =
    payload;
  if (name) {
    const slug = generateSlug(name);
    userUpdatedData.name = name;
    userUpdatedData.slug = slug;
    patientUpdatedData.slug = slug;
  }
  if (email) userUpdatedData.email = email;
  if (profilePicture) userUpdatedData.profilePicture = profilePicture;
  if (contact) userUpdatedData.contact = contact;
  if (role) userUpdatedData.role = role;
  if (gender) userUpdatedData.gender = gender;

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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await UserModel.findOneAndUpdate({ email: user.email }, userUpdatedData, { session });
    await DoctorModel.findOneAndUpdate({ user: userData._id }, patientUpdatedData, { session });
    await session.commitTransaction();
    session.endSession();
    return {
      ...patientUpdatedData,
      user: userUpdatedData,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const doctorActionFromAdmin = async (
  slug: string,
  payload: { isDelete?: boolean; isActive?: boolean },
) => {
  const userData = await DoctorModel.findOne({ slug });

  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  const updatedDoctor = await DoctorModel.findOneAndUpdate({ slug }, payload, {
    new: true,
    runValidators: true,
  });
  return updatedDoctor;
};

const deleteMyProfileFromDb = async (user: TTokenUser) => {
  const userData = await UserModel.findOne({ email: user.email });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }
  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is already Deleted");
  }
  if (!userData.validation?.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Your Account is not verified");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await UserModel.findOneAndUpdate({ email: user.email }, { isDelete: true }, { session });
    await DoctorModel.findOneAndUpdate({ user: userData._id }, { isDelete: true }, { session });
    await session.commitTransaction();
    session.endSession();
    return null;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

export const DoctorServices = {
  createDoctorFromDb,
  getDoctorsFromDb,
  getSingleDoctorFromDb,
  getProfileFromDb,
  updateDoctorIntoDb,
  deleteMyProfileFromDb,
  doctorActionFromAdmin,
  updateDoctorByAdmin,
};
