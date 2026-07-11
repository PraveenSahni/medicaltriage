import type { ErrorRequestHandler } from "express";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
  code?: string;
};

function statusCodeFor(error: HttpError): number {
  return error.status ?? error.statusCode ?? 500;
}

function isCorsOriginRejection(error: HttpError): boolean {
  return error.code === "CORS_ORIGIN_FORBIDDEN" || statusCodeFor(error) === 403;
}

export const corsRejectionHandler: ErrorRequestHandler = (error: HttpError, _req, res, next) => {
  if (!isCorsOriginRejection(error)) {
    return next(error);
  }

  return res.status(403).json({
    error: "Forbidden",
    message: "Origin not allowed by security policies"
  });
};

export const globalErrorHandler: ErrorRequestHandler = (error: HttpError, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (isCorsOriginRejection(error)) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Origin not allowed by security policies"
    });
  }

  const status = statusCodeFor(error);
  if (status >= 400 && status < 500) {
    return res.status(status).json({
      error: error.message || "Request rejected"
    });
  }

  return res.status(500).json({
    error: "Internal Server Error",
    message: "Unexpected server error"
  });
};
