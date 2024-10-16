import config from "../config";
import { USER_ROLE } from "../modules/user/user.constant";
import { TUser } from "../modules/user/user.interface";
import UserModel from "../modules/user/user.model";
import bcrypt from "bcrypt";

const admin: any = {
  name: "Admin",
  gender: "male",
  isActive: true,
  isDelete: false,
  contact: "1234567890",
  profilePicture:null,
  slug: "admin",
  validation: {
    otp: 0,
    expiry: null,
    isVerified: true,
  },
  password: "123456",
  email: "admin@gmail.com",
  role: USER_ROLE.admin,
};
const seedAdmin = async () => {
  
  const hashedPassword = bcrypt.hashSync(admin.password, Number(config.bcrypt_salt_rounds));
  admin.password = hashedPassword;
  // seed  admin
  const isAdminExists = await UserModel.findOne({ role: admin.role, email: admin.email });
  if (!isAdminExists) {
    try {
      await UserModel.create(admin);
    } catch (error) {
      console.log(error);
    }
  }
};

export default seedAdmin;
