import * as httpStatus from 'http-status';
import { errorResponse } from './apiWrapper';

// handle not found errors
export const notFound = (req, res, next) => {
  errorResponse(res, 'Requested Resource Not Found', 404);
};

// handle internal server errors
export const internalServerError = (err, req, res, next) => {
  errorResponse(res, err, 500);
};
