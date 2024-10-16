import { Request, Response } from "express";

type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  data: T;
  meta?: TMeta;
};


const sendResponse = <T>(req: Request, res: Response, data: TResponse<T>) => {
  res.status(data?.statusCode).json({
    success: true,
    message: req.t(data?.message!),
    meta: data?.meta,
    data: data?.data,
  });
};

export default sendResponse;