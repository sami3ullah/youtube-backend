import { NextFunction, Request, Response } from "express";

type ErrorRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => any;

export const asyncHandler = (fn: ErrorRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => next(error));
  };
};
