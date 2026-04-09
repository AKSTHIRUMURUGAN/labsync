import { NextResponse } from 'next/server';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fields?: { [field: string]: string };
    details?: any;
    timestamp: string;
    requestId?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export function successResponse<T>(data: T, meta?: APIResponse['meta']): NextResponse<APIResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  fields?: { [field: string]: string },
  details?: any
): NextResponse<APIResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(fields && { fields }),
        ...(details && { details }),
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function validationError(fields: { [field: string]: string }): NextResponse<APIResponse> {
  return errorResponse('VALIDATION_ERROR', 'Invalid input data', 400, fields);
}

export function unauthorizedError(message: string = 'Unauthorized'): NextResponse<APIResponse> {
  return errorResponse('UNAUTHORIZED', message, 401);
}

export function forbiddenError(message: string = 'Forbidden'): NextResponse<APIResponse> {
  return errorResponse('FORBIDDEN', message, 403);
}

export function notFoundError(message: string = 'Resource not found'): NextResponse<APIResponse> {
  return errorResponse('NOT_FOUND', message, 404);
}

export function conflictError(message: string, details?: any): NextResponse<APIResponse> {
  return errorResponse('CONFLICT', message, 409, undefined, details);
}

export function serverError(message: string = 'Internal server error'): NextResponse<APIResponse> {
  return errorResponse('SERVER_ERROR', message, 500);
}
