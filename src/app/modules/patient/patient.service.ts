import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TTokenUser } from "../../types/common";
import UserModel from "../user/user.model";
import PatientModel from "./patient.model";
import { TPatient } from "./patient.interface";
import { TUser } from "../user/user.interface";
import { BloodPressureModel } from "../bloodPressure/bloodPressure.model";
import { GlucoseModel } from "../glucose/glucose.model";
import { WeightModel } from "../weight/weight.model";
import { HealthRecordModel } from "../healthRecord/healthRecord.model";
import mongoose from "mongoose";
import { generateSlug } from "../../utils/generateSlug";
import ConnectionModel from "../connections/connection.model";
import { sendNotification } from "../notification/sendNotification";
import moment from "moment";

const getAllPatientsFromDb = async (query: Record<string, unknown>) => {
  const userFields = (query?.userFields as string)?.split(",").join(" ");

  if (query?.userFields) {
    delete query.userFields;
  }
  const patientQuery = new QueryBuilder(
    PatientModel,
    PatientModel.find().populate({ path: "user", select: userFields }),
    query,
  )
    .search(["name", "slug"], {
      lookupFrom: "users",
      localField: "user",
      foreignField: "_id",
      lookupAs: "user",
    })
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await patientQuery.countTotal();
  const patients = await patientQuery.modelQuery;
  return { meta, patients };
};

const getSinglePatientFromDb = async (slug: string, query: Record<string, unknown>) => {
  const userData = await UserModel.findOne({ slug: slug }).lean();
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

  let fields = query.fields ? (query.fields as string).replace(",", " ") : "-__v";
  const patient = await PatientModel.findOne({ slug }).populate("user").select(fields).lean();
  //const bloodPressure = await BloodPressureModel.find({ user: userData?._id });
  //const glucose = await GlucoseModel.find({ user: userData?._id });
  //const weight = await WeightModel.find({ user: userData?._id });
  //const healthRecord = await HealthRecordModel.find({ user: userData?._id });

  return {
    ...patient,
    //bloodPressure,
    //glucose,
    //weight,
    //healthRecord,
  };
};

const getPatientProfileFromDb = async (user: TTokenUser) => {
  const userData = await UserModel.findOne({ email: user.email });
  const patientData = await PatientModel.findOne({ user: userData?._id }).populate("user");
  return patientData;
};

const updatePatientProfileIntoDb = async (
  user: TTokenUser,
  payload: Partial<TPatient> & Partial<TUser>,
) => {
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
    await PatientModel.findOneAndUpdate({ user: userData._id }, patientUpdatedData, { session });
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
const patientActionForAdmin = async (
  slug: string,
  payload: { isDelete?: boolean; isActive?: boolean },
) => {
  const updatedData: Record<string, unknown> = {};
  if (payload.isActive !== undefined) updatedData.isActive = payload.isActive;
  if (payload.isDelete !== undefined) updatedData.isDelete = payload.isDelete;
  const userData = await UserModel.findOne({ slug: slug });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await UserModel.findOneAndUpdate({ slug: slug }, updatedData, { session });
    await PatientModel.findOneAndUpdate({ user: userData._id }, updatedData, { session });
    await session.commitTransaction();
    session.endSession();
    return null;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const deleteMyAccountFromDb = async (user: TTokenUser) => {
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
    await PatientModel.findOneAndUpdate({ user: userData._id }, { isDelete: true }, { session });
    await session.commitTransaction();
    session.endSession();
    return null;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const setupAlertIntoDb = async (
  user: TTokenUser,
  payload: { type: "bloodPressure" | "glucose" | "weight"; alert: boolean },
) => {
  const userData = await UserModel.findOne({ email: user.email });
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await UserModel.findOneAndUpdate(
      { email: user.email },
      { [payload.type]: payload.alert },
      { session },
    );
    await session.commitTransaction();
    session.endSession();
    return null;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getPatientBloodPressureFromDb = async (userId: string, query: Record<string, unknown>) => {
  const userData = await UserModel.findById(userId).lean();
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

  const bloodPressureQuery = new QueryBuilder(
    BloodPressureModel,
    BloodPressureModel.find({ user: userData._id }),
    query,
  )
    .search(["date", "time"], {})
    .filter();
  const result = await bloodPressureQuery.modelQuery;

  return result;
};

const getGlucoseFromDb = async (userId: string, query: Record<string, unknown>) => {
  const userData = await UserModel.findById(userId).lean();
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

  const glucoseQuery = new QueryBuilder(
    GlucoseModel,
    GlucoseModel.find({ user: userData._id }),
    query,
  ).filter();
  const result = await glucoseQuery.modelQuery;
  return result;
};

const getHealthRecordFromDb = async (userId: string) => {
  const result = await HealthRecordModel.find({ user: userId }).lean();
  return result;
};

const getPatientWeightFromDb = async (userId: string, query: Record<string, unknown>) => {
  const userData = await UserModel.findById(userId).lean();
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

  if (query?.date) {
    const startOfDay = moment(query.date).startOf("day").toDate();
    const endOfDay = moment(query.date).endOf("day").toDate();

    // Modify the query to include the date range for the entire day
    query.date = { $gte: startOfDay, $lte: endOfDay };
  }

  const weightQuery = new QueryBuilder(
    WeightModel,
    WeightModel.find({ user: userData._id }).populate("user tracker"),
    query,
  ).filter();
  const result = await weightQuery.modelQuery;
  return result;
};

const updatePatientByDoctorIntoDb = async (
  user: TTokenUser,
  userId: string,
  payload: Partial<TPatient>,
) => {
  const doctorData = await UserModel.findOne({ email: user.email });
  if (!doctorData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (!doctorData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }
  if (doctorData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is already Deleted");
  }
  if (!doctorData.validation?.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Your Account is not verified");
  }

  const isPatientExist = await UserModel.findById(userId);

  if (!isPatientExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "Patient Not Found");
  }

  const isDoctorConnected = await ConnectionModel.findOne({
    patient: userId,
    status: "accept",
    doctor: doctorData._id,
  });

  if (!isDoctorConnected) {
    throw new AppError(httpStatus.BAD_REQUEST, "You are not connected with this patient");
  }

  const result = await PatientModel.findOneAndUpdate({ user: userId }, payload, {
    new: true,
    runValidators: true,
  });

  //  . High-risk for placental dysfunction (this warning should be placed in
  //case of the following: More than 40 years, twin pregnancy, more than 10
  //years between after the previous pregnancy, in case of in vitro
  //fertilization, in case of chronic hypertension, in case of previous
  //preeclampsia, in case of type 1 or 2 diabetes, in case of Lupus, in case
  //of antiphospholipid syndrome, in case the patient’s doctor said she has
  //higher risk of preeclampsia or fetal growth restriction)

  const warningField = {
    age: result.age,
    pregnancyType: result.pregnancyType,
    currentPregnancyTime: result.currentPregnancyTime,
    lastPregnancyTime: result.lastPregnancyTime,
    vitroFertilization: result.vitroFertilization,
    chronicHypertension: result.chronicHypertension,
    lupus: result.lupus,
    antiphospholipidSyndrome: result.antiphospholipidSyndrome,
    historyOfPreeclampsia: result.historyOfPreeclampsia,
    higherRiskOfPreeclampsia: result.higherRiskOfPreeclampsia,
  };

  if (warningField.age > 40) {
    const notificationResult = await sendNotification([isPatientExist.fcmToken], {
      type: "doctor",
      title: "Alert",
      body: `You are ${warningField.age} years old. You have high-risk for placental dysfunction`,
      userId: doctorData._id.toString(),
    });
    console.log(notificationResult);
  }

  if (warningField.pregnancyType === "multiple") {
    const notificationResult = await sendNotification([isPatientExist.fcmToken], {
      type: "doctor",
      title: "Alert",
      body: `You have twin pregnancies. You have high-risk for placental dysfunction`,
      userId: doctorData._id.toString(),
    });
    console.log(notificationResult.responses);
  }

  // NEED TO CALCULATE LAST PREGNANCY TIME AND CURRENT PREGNANCY TIME DIFFERENCE
  if (
    moment(warningField.currentPregnancyTime).diff(
      moment(warningField.lastPregnancyTime),
      "years",
    ) > 10
  ) {
    const notificationResult = await sendNotification([isPatientExist.fcmToken], {
      type: "doctor",
      title: "Alert",
      body: `You have more than 10 years between after the previous pregnancy. You have high-risk for placental dysfunction`,
      userId: doctorData._id.toString(),
    });
    console.log(notificationResult);
  }

  if (warningField.vitroFertilization) {
    const notificationResult = await sendNotification([isPatientExist.fcmToken], {
      type: "doctor",
      title: "Alert",
      body: `You have vitro fertilization. You have high-risk for placental dysfunction`,
      userId: doctorData._id.toString(),
    });
    console.log(notificationResult);
  }

  if (warningField.chronicHypertension) {
    const notificationResult = await sendNotification([isPatientExist.fcmToken], {
      type: "doctor",
      title: "Alert",
      body: `You have chronic hypertension. You have high-risk for placental dysfunction`,
      userId: doctorData._id.toString(),
    });
    console.log(notificationResult);
  }

  if (warningField.lupus) {
    const notificationResult = await sendNotification([isPatientExist.fcmToken], {
      type: "doctor",
      title: "Alert",
      body: `You have lupus. You have high-risk for placental dysfunction`,
      userId: doctorData._id.toString(),
    });
    console.log(notificationResult);
  }

  if (warningField.antiphospholipidSyndrome) {
    const notificationResult = await sendNotification([isPatientExist.fcmToken], {
      type: "doctor",
      title: "Alert",
      body: `You have antiphospholipid syndrome. You have high-risk for placental dysfunction`,
      userId: doctorData._id.toString(),
    });
    console.log(notificationResult);
  }

  if (warningField.historyOfPreeclampsia) {
    const notificationResult = await sendNotification([isPatientExist.fcmToken], {
      type: "doctor",
      title: "Alert",
      body: `You have history of preeclampsia. You have high-risk for placental dysfunction`,
      userId: doctorData._id.toString(),
    });
    console.log(notificationResult);
  }

  return result;
};

export const PatientServices = {
  getAllPatientsFromDb,
  getSinglePatientFromDb,
  getPatientProfileFromDb,
  updatePatientProfileIntoDb,
  deleteMyAccountFromDb,
  patientActionForAdmin,
  setupAlertIntoDb,
  getPatientBloodPressureFromDb,
  getGlucoseFromDb,
  getHealthRecordFromDb,
  getPatientWeightFromDb,
  updatePatientByDoctorIntoDb,
};
