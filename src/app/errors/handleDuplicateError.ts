import httpStatus from "http-status";
import { TErrorSources, TGenericErrorResponse } from "../types/error";

const handleDuplicateError = (err: any): TGenericErrorResponse => {
  const statusCode = httpStatus.BAD_REQUEST;
  const [errorValue] = Object.values(err.keyValue);

  const errorSources: TErrorSources = [
    {
      message: `${errorValue} is already exists`,
      path: "",
    },
  ];

  return {
    statusCode,
    message: `${errorValue} is already exists`,
    errorSources,
  };
};

export default handleDuplicateError;
