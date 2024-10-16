import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import config from "../config";
import handleZodError from "../errors/handleZodError";
import handleValidationError from "../errors/handleValidationError";
import handleCastError from "../errors/handleCastError";
import handleDuplicateError from "../errors/handleDuplicateError";
import AppError from "../errors/AppError";
import { TErrorSources } from "../types/error";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // SET DEFAULT VALUES
  let statusCode = 500;
  let message = "Something went wrong";

  let errorSources: TErrorSources = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  // const language = req.headers?.['accept-language']
  // console.log(error)

  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (error?.name === "ValidationError") {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (error.name === "CastError") {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (error.code === 11000) {
    const simplifiedError = handleDuplicateError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
  } else if (error instanceof AppError) {
    const messageFirstWord = error.message.split(" ")[0];
    const isDuplicateError = error.message.split(" ").find(word => word === "E11000");
    if (messageFirstWord === "E11000" || isDuplicateError) {
      const regex = /index:\s(\w+)_\d+\sdup\skey:\s\{\s(\w+):\s"(.*?)"\s\}/;
      const match = error.message.match(regex);
      if (match) {
        const field = match[2];
        const value = match[3];
        message = `${field} '${value}' is already exists`;
        errorSources = [
          {
            path: "",
            message: `${field} '${value}' is already exists`,
          },
        ];
      }
    } else {

    statusCode = error?.statusCode;
    message = error.message;
    errorSources = [
      {
        path: "",
        message: error.message,
      },
    ];
    }
  } 
  else if (error instanceof Error) {
    message = error?.message;
    errorSources = [
      {
        path: "",
        message: error.message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    message:  req.t(message),
    errorSources,
    // stack: config.NODE_ENV === "development" ? error?.stack : null,
    error,
  });
};

export default globalErrorHandler;
