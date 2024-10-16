import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join((process.cwd(), ".env")) });

export default {
  NODE_ENV: process.env.NODE_ENV,
  appLink: process.env.APP_LINK,
  port: process.env.PORT,
  socket_port: process.env.SOCKET_PORT,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  default_password: process.env.DEFAULT_PASSWORD,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_reset_secret: process.env.JWT_RESET_SECRET,
  jwt_reset_token_expire_in: process.env.JWT_RESET_TOKEN_EXPIRED_IN,
  access_token_expire_in: process.env.JWT_ACCESS_TOKEN_EXPIRED_IN,
  refresh_token_expire_in: process.env.JWT_REFRESH_TOKEN_EXPIRED_IN,

  ip: process.env.IP,
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET,
  },
  firebase: {
    firebase_apikey: process.env.FIREBASE_APIKEY,
    firebase_authdomain: process.env.FIREBASE_AUTHDOMAIN,
    firebase_projectid: process.env.FIREBASE_PROJECTID,
    firebase_storagebucket: process.env.FIREBASE_STORAGEBUCKET,
    firebase_messagingsenderid: process.env.FIREBASE_MESSAGINGSENDERID,
    firebase_appid: process.env.FIREBASE_APPID,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};
