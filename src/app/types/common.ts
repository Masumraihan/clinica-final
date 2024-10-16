import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export type TTokenUser = { email: string; role: TUserRole; _id: string } & JwtPayload;
export interface CustomRequest extends Request {
  user: TTokenUser;
}

export type TUserRole = "patient" | "admin" | "doctor";
