import { supabase, isSupabaseConfigured } from '../config/supabase';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface UserProfileData {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | 'elite' | null;
  onboarding_done: boolean;
  height_cm?: number | null;
  weight_kg?: number | null;
  date_of_birth?: string | null;
}

export interface WorkoutExerciseItem {
  id?: string;
  workout_id?: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps: number;
  target_weight_kg?: number | null;
  rest_seconds?: number | null;
  name?: string;
  category?: string;
  exercise?: {
    id: string;
    name: string;
    category?: string;
    target_muscle_group?: string;
    equipment?: string;
    description?: string;
  };
}

export interface WorkoutItem {
  id: string;
  creator_id: string;
  title: string;
  description?: string | null;
  category: 'strength' | 'hypertrophy' | 'endurance' | 'mobility' | 'hiit' | 'rehab' | 'other' | string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite' | string;
  is_public: boolean;
  estimated_duration_min?: number | null;
  exercises?: WorkoutExerciseItem[];
  created_at?: string;
}

export interface WorkoutFilters {
  page?: number;
  limit?: number;
  category?: string;
  difficulty?: string;
  mine?: boolean;
}

export interface UserDashboardMetrics {
  formScore: number | null;
  formScoreDelta: string | null;
  activeMins: number | null;
  activeMinsPeriod: string | null;
  caloriesBurned: number | null;
}

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:3000';
};

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: any;

  constructor(message: string, code: string = 'API_ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export interface RequestOptions extends RequestInit {
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let url = `${baseUrl}${cleanEndpoint}`;

  if (options.query) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const token = options.token !== undefined ? options.token : await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error: any) {
    throw new ApiError(
      'Network request failed. Please check your connection.',
      'NETWORK_ERROR',
      0
    );
  }

  let json: any;
  try {
    json = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(
        `Server responded with status ${response.status}`,
        'SERVER_ERROR',
        response.status
      );
    }
    return {} as T;
  }

  if (!response.ok || json.success === false) {
    const errorCode = json?.error?.code || `HTTP_${response.status}`;
    const errorMessage = json?.error?.message || 'An error occurred while processing the request.';
    throw new ApiError(errorMessage, errorCode, response.status, json?.error?.details);
  }

  return json.data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  async getCurrentUserProfile(token?: string | null): Promise<UserProfileData> {
    return apiClient.get<UserProfileData>('/api/v1/users/me', { token });
  },

  async getWorkouts(filters: WorkoutFilters = {}, token?: string | null): Promise<WorkoutItem[]> {
    return apiClient.get<WorkoutItem[]>('/api/v1/workouts', {
      query: filters as Record<string, string | number | boolean | undefined>,
      token,
    });
  },

  async getWorkoutById(workoutId: string, token?: string | null): Promise<WorkoutItem> {
    return apiClient.get<WorkoutItem>(`/api/v1/workouts/${workoutId}`, { token });
  },
};
