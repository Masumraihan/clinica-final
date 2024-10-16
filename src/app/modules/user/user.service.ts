import httpStatus from "http-status";
import { generateSlug } from "../../utils/generateSlug";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../errors/AppError";
import { TTokenUser } from "../../types/common";
import { TUser } from "./user.interface";
import UserModel from "./user.model";

const getAllUsersFromDb = async (query: Record<string, unknown>) => {
  const patientQuery = new QueryBuilder(UserModel, UserModel.find({ isDelete: false }), query)
    .search(["name", "email", "role"], {})
    .filter()
    .sort()
    .paginate()
    .fields();
  const meta = await patientQuery.countTotal();
  const users = await patientQuery.modelQuery;
  return { meta, users };
};

const getSingleUserFromDb = async (slug: string) => {
  const result = await UserModel.findOne({ slug, isDelete: false });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  return result;
};

const updateUser = async (slug: string, payload: Partial<TUser>) => {
  const result = await UserModel.findOneAndUpdate(
    { slug },
    { ...payload },
    { new: true, runValidators: true },
  );
  return result;
};

const deleteMyProfileFromDb = async (user: TTokenUser) => {
  const userData = await UserModel.findOne({ email: user.email }).select("+password").lean();
  if (!userData) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }
  if (!userData.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Account is Blocked");
  }
  if (userData.isDelete) {
    throw new AppError(httpStatus.BAD_REQUEST, "This Account already Deleted");
  }
  if (!userData.validation?.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Your Account is not verified");
  }

  await UserModel.findOneAndUpdate({ _id: userData._id }, { isDelete: true });
  return null;
};

const getUsersCount = async (query: Record<string, unknown>) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Use the provided year or default to the current year
  const targetYear = Number(query?.year) || new Date().getFullYear();
  console.log(targetYear, "year");

  const userCounts = await UserModel.aggregate([
    {
      // Match users based on the query and creation date in the target year
      $match: {
        ...query,
        createdAt: {
          $gte: new Date(`${targetYear}-01-01`), // Start of the target year
          $lt: new Date(`${targetYear + 1}-01-01`), // Start of the next year
        },
      },
    },
    {
      // Group by month and role, then count users
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          role: "$role", // Group by role as well
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0, // Remove _id field
        monthIndex: "$_id.month", // Month from group _id
        role: "$_id.role", // Role from group _id
        count: 1,
      },
    },
  ]);

  // Initialize an empty object to hold the results
  const result = {};

  // Organize counts by month and role
  userCounts.forEach(({ monthIndex, role, count }) => {
    const month = months[monthIndex - 1]; // Convert month index to month name
    if (!result[month]) {
      result[month] = { name: month.substr(0, 3), doctor: 0, user: 0 }; // Initialize doctor and user count
    }
    result[month][role] = count; // Assign the count based on the role
  });

  // Ensure all months are accounted for and in the correct format
  const allMonths = months.map((month) => {
    return result[month] || { name: month.substr(0, 3), doctor: 0, user: 0 }; // Default to 0 if no data exists for a role
  });

  return allMonths;
};

const getUserProfileFromDb = async (user: TTokenUser) => {
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
  return userData;
};

const updateUserIntoDb = async (user: TTokenUser, payload: Partial<TUser>) => {
  const userUpdatedData: Partial<TUser> = {};
  const { name, email, profilePicture, contact, role, gender } = payload;
  if (name) {
    const slug = generateSlug(name);
    userUpdatedData.name = name;
    userUpdatedData.slug = slug;
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
  try {
    const result = await UserModel.findOneAndUpdate({ email: user.email }, userUpdatedData);
    return result;
  } catch (error: any) {
    throw new AppError(httpStatus.BAD_REQUEST, error.message);
  }
};

export const UserServices = {
  getAllUsersFromDb,
  getSingleUserFromDb,
  updateUser,
  deleteMyProfileFromDb,
  getUsersCount,
  getUserProfileFromDb,
  updateUserIntoDb,
};
