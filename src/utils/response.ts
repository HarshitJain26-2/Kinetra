import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse } from '../types/api.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ApiSuccessResponse<T>['meta']
): Response => {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): Response => {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(response);
};
