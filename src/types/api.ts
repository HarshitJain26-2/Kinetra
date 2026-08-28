export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}
