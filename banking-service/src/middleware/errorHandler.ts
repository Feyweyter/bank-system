import { Request, Response, NextFunction } from "express";
import { BankingError } from "../types";
import { logger } from "../config/logger";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  logger.error("Unhandled error", {
    error,
    url: req.url,
    method: req.method,
  });

  if (error instanceof BankingError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal error occurred",
      },
    });
  }
}
