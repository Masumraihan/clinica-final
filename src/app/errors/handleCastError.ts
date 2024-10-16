import mongoose from "mongoose";
import { TErrorSources, TGenericErrorResponse } from "../types/error";


const handleCastError = (err: mongoose.Error.CastError): TGenericErrorResponse => {
  const statusCode = 400;

  const errorSources: TErrorSources = [
    {
      message: err.message,
      path: err.path,
    },
  ];

  return {
    statusCode,
    message: "Invalid ID",
    errorSources,
  };
};

export default handleCastError;
