import mongoose from "mongoose";
import { TErrorSources, TGenericErrorResponse } from "../types/error";

const handleValidationError = (err: mongoose.Error.ValidationError): TGenericErrorResponse => {
  const statusCode = 400;
  const errorSources: TErrorSources = Object.values(err.errors).map(
    (val: mongoose.Error.ValidatorError | mongoose.Error.CastError) => {
      return {
        message: val.message,
        path: val.path,
      };
    },
  );
  return {
    statusCode,
    message: "Validation Error",
    errorSources,
  };
};
export default handleValidationError;
