export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST', details?: any) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'INVALID_TOKEN') {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', code: string = 'CONFLICT') {
    super(409, code, message);
  }
}

export class DuplicateRecordError extends AppError {
  constructor(message: string = 'A record with these values already exists', code: string = 'DUPLICATE_RECORD') {
    super(409, code, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Request validation failed', details?: any) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', code: string = 'DATABASE_ERROR') {
    super(500, code, message);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', code: string = 'INTERNAL_ERROR') {
    super(500, code, message);
  }
}

