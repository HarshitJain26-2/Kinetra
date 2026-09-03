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

export interface SessionItem {
  id: string;
  user_id: string;
  workout_id: string | null;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  calories_est: number | null;
  notes: string | null;
}

export interface SessionExerciseDetail {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
  form_score: number | null;
  injury_flag: boolean;
  feedback: string | null;
  recorded_at: string;
  exercise?: {
    id: string;
    name: string;
    category?: string;
  };
}

export interface FullSessionItem extends SessionItem {
  exercises?: SessionExerciseDetail[];
  summary?: {
    total_sets: number;
    total_reps: number;
    avg_form_score: number | null;
    injury_flags_raised: number;
  };
}

export interface ChartDataPoint {
  id: string;
  date: string;
  label: string;
  value: number;
}

export interface ComputedAnalytics {
  totalWorkouts: number;
  totalReps: number | null;
  activeMinutes: number;
  caloriesBurned: number | null;
  avgFormScore: number | null;
  currentStreak: number;
  weeklyActiveDays: boolean[]; // Mon to Sun
  repTrend: ChartDataPoint[];
  formScoreTrend: ChartDataPoint[];
  durationTrend: ChartDataPoint[];
  calorieTrend: ChartDataPoint[];
}

export const computeAnalyticsFromSessions = (
  sessions: SessionItem[],
  timeRange: '7D' | '30D' | '90D' | 'ALL'
): ComputedAnalytics => {
  const now = new Date();
  let cutoffDate: Date | null = null;

  if (timeRange === '7D') {
    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === '30D') {
    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeRange === '90D') {
    cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }

  const completedSessions = sessions.filter((s) => {
    // Guard against null/undefined entries from malformed API responses
    if (!s || typeof s !== 'object') return false;
    if (s.status !== 'completed' && s.ended_at === null) return false;
    if (!cutoffDate) return true;
    const sessionTime = new Date(s.started_at).getTime();
    return Number.isFinite(sessionTime) && sessionTime >= cutoffDate.getTime();
  });

  // Sort chronologically ascending for charts
  const sortedSessions = [...completedSessions].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );

  let totalDurationSec = 0;
  let totalCalories: number | null = null;
  let formScoreSum = 0;
  let formScoreCount = 0;
  let totalReps: number | null = null;

  const repTrend: ChartDataPoint[] = [];
  const formScoreTrend: ChartDataPoint[] = [];
  const durationTrend: ChartDataPoint[] = [];
  const calorieTrend: ChartDataPoint[] = [];

  const workoutDatesSet = new Set<string>();

  for (const session of sortedSessions) {
    const sessionDate = new Date(session.started_at);
    const dateStr = sessionDate.toISOString().split('T')[0];
    workoutDatesSet.add(dateStr);

    const monthDay = `${sessionDate.getMonth() + 1}/${sessionDate.getDate()}`;

    if (session.duration_sec && session.duration_sec > 0) {
      totalDurationSec += session.duration_sec;
      const mins = Math.round(session.duration_sec / 60);
      durationTrend.push({
        id: session.id,
        date: dateStr,
        label: monthDay,
        value: mins,
      });
    }

    if (session.calories_est !== null && session.calories_est !== undefined) {
      if (totalCalories === null) totalCalories = 0;
      totalCalories += session.calories_est;
      calorieTrend.push({
        id: session.id,
        date: dateStr,
        label: monthDay,
        value: Math.round(session.calories_est),
      });
    }

    // Check full session summary if available
    const fullSession = session as FullSessionItem;
    if (fullSession.summary?.total_reps !== undefined) {
      if (totalReps === null) totalReps = 0;
      totalReps += fullSession.summary.total_reps;
      repTrend.push({
        id: session.id,
        date: dateStr,
        label: monthDay,
        value: fullSession.summary.total_reps,
      });
    }

    if (fullSession.summary?.avg_form_score !== undefined && fullSession.summary.avg_form_score !== null) {
      formScoreSum += fullSession.summary.avg_form_score;
      formScoreCount++;
      formScoreTrend.push({
        id: session.id,
        date: dateStr,
        label: monthDay,
        value: Math.round(fullSession.summary.avg_form_score),
      });
    }
  }

  // Calculate Streak — all comparisons use UTC date strings to match session.started_at toISOString()
  let streak = 0;
  const nowMs = Date.now();

  // Derive today's UTC date string (matches what toISOString().split('T')[0] produces)
  const todayStr = new Date(nowMs).toISOString().split('T')[0];
  const yesterdayStr = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Start streak count from today if trained, otherwise yesterday, else no streak
  let streakAnchorMs: number | null = workoutDatesSet.has(todayStr)
    ? nowMs
    : workoutDatesSet.has(yesterdayStr)
    ? nowMs - 24 * 60 * 60 * 1000
    : null;

  if (streakAnchorMs !== null) {
    // Walk backwards day by day using UTC dates
    let cursor = streakAnchorMs;
    while (true) {
      const dateKey = new Date(cursor).toISOString().split('T')[0];
      if (workoutDatesSet.has(dateKey)) {
        streak++;
        cursor -= 24 * 60 * 60 * 1000;
      } else {
        break;
      }
    }
  }

  // Calculate Weekly active days (Mon–Sun) using UTC day of week
  const utcDayOfWeek = new Date(nowMs).getUTCDay(); // 0=Sun, 1=Mon…6=Sat
  const distanceToMonday = utcDayOfWeek === 0 ? -6 : 1 - utcDayOfWeek;
  const mondayMs = nowMs + distanceToMonday * 24 * 60 * 60 * 1000;
  // Snap to UTC midnight of that Monday
  const mondayMidnightMs = new Date(new Date(mondayMs).toISOString().split('T')[0] + 'T00:00:00.000Z').getTime();

  const weeklyActiveDays: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const dayKey = new Date(mondayMidnightMs + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    weeklyActiveDays.push(workoutDatesSet.has(dayKey));
  }

  return {
    totalWorkouts: completedSessions.length,
    totalReps,
    activeMinutes: Math.round(totalDurationSec / 60),
    caloriesBurned: totalCalories ? Math.round(totalCalories) : null,
    avgFormScore: formScoreCount > 0 ? Math.round(formScoreSum / formScoreCount) : null,
    currentStreak: streak,
    weeklyActiveDays,
    repTrend,
    formScoreTrend,
    durationTrend,
    calorieTrend,
  };
};

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

  async getUserSessions(
    filters: { status?: string; page?: number; limit?: number } = {},
    token?: string | null
  ): Promise<SessionItem[]> {
    return apiClient.get<SessionItem[]>('/api/v1/sessions', {
      query: filters as Record<string, string | number | boolean | undefined>,
      token,
    });
  },

  async getSessionById(sessionId: string, token?: string | null): Promise<FullSessionItem> {
    return apiClient.get<FullSessionItem>(`/api/v1/sessions/${sessionId}`, { token });
  },

  async logSessionExercise(
    sessionId: string,
    payload: {
      exercise_id: string;
      set_number?: number;
      sets?: number;
      reps?: number | null;
      weight_kg?: number | null;
      duration_sec?: number | null;
      duration_seconds?: number | null;
      form_score?: number | null;
      injury_flag?: boolean;
      feedback?: string | null;
    },
    token?: string | null
  ): Promise<any> {
    const body = {
      exercise_id: payload.exercise_id,
      set_number: payload.set_number ?? payload.sets ?? 1,
      reps: payload.reps ?? null,
      weight_kg: payload.weight_kg ?? null,
      duration_sec: payload.duration_sec ?? payload.duration_seconds ?? null,
      form_score: payload.form_score ?? null,
      injury_flag: payload.injury_flag ?? false,
      feedback: payload.feedback ?? null,
    };
    return apiClient.post(`/api/v1/sessions/${sessionId}/log-exercise`, body, { token });
  },

  async submitPoseAnalysis(
    payload: {
      session_id?: string;
      exercise_id: string;
      set_number?: number;
      reps: number;
      weight_kg?: number | null;
      duration_sec?: number | null;
      duration_ms?: number;
      form_score: number;
      injury_flag?: boolean;
      flagged_body_parts?: string[];
      flags?: string[];
      rep_scores?: number[];
      notes?: string | null;
    },
    token?: string | null
  ): Promise<any> {
    const body = {
      session_id: payload.session_id,
      exercise_id: payload.exercise_id,
      set_number: payload.set_number ?? 1,
      reps: payload.reps,
      weight_kg: payload.weight_kg ?? null,
      duration_sec: payload.duration_sec ?? (payload.duration_ms ? Math.round(payload.duration_ms / 1000) : null),
      form_score: payload.form_score,
      injury_flag: payload.injury_flag ?? (payload.flags && payload.flags.length > 0) ?? false,
      flagged_body_parts: payload.flagged_body_parts ?? payload.flags ?? [],
      rep_scores: payload.rep_scores,
      notes: payload.notes ?? null,
    };
    return apiClient.post('/api/v1/pose-analysis', body, { token });
  },

  async updateUserProfile(
    payload: Partial<Omit<UserProfileData, 'id' | 'email'>>,
    token?: string | null
  ): Promise<UserProfileData> {
    return apiClient.put<UserProfileData>('/api/v1/users/me', payload, { token });
  },

  async getExercises(
    query: { muscle_group?: string; difficulty?: string; page?: number; limit?: number } = {},
    token?: string | null
  ): Promise<ExerciseCatalogItem[]> {
    return apiClient.get<ExerciseCatalogItem[]>('/api/v1/exercises', {
      query: query as Record<string, string | number | boolean | undefined>,
      token,
    });
  },

  async createWorkout(
    payload: CreateWorkoutInput,
    token?: string | null
  ): Promise<WorkoutItem> {
    return apiClient.post<WorkoutItem>('/api/v1/workouts', payload, { token });
  },

  async startSession(
    workout_id?: string | null,
    token?: string | null
  ): Promise<{ id: string; status: string; started_at: string }> {
    return apiClient.post('/api/v1/sessions/start', { workout_id }, { token });
  },

  async endSession(
    sessionId: string,
    notes?: string,
    token?: string | null
  ): Promise<FullSessionItem> {
    return apiClient.post(`/api/v1/sessions/${sessionId}/end`, { notes }, { token });
  },

  async getDailyFoodLogs(date?: string, token?: string | null): Promise<DailyFoodLogItem[]> {
    return apiClient.get<DailyFoodLogItem[]>('/api/v1/nutrition/logs', {
      query: date ? { date } : undefined,
      token,
    });
  },

  async createFoodLog(payload: CreateFoodLogInput, token?: string | null): Promise<DailyFoodLogItem> {
    return apiClient.post<DailyFoodLogItem>('/api/v1/nutrition/logs', payload, { token });
  },

  async deleteFoodLog(id: string, token?: string | null): Promise<void> {
    return apiClient.delete(`/api/v1/nutrition/logs/${id}`, { token });
  },

  async getNutritionProfile(token?: string | null): Promise<NutritionProfileData> {
    return apiClient.get<NutritionProfileData>('/api/v1/nutrition/profile', { token });
  },

  async upsertNutritionProfile(
    payload: Partial<Omit<NutritionProfileData, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    token?: string | null
  ): Promise<NutritionProfileData> {
    return apiClient.put<NutritionProfileData>('/api/v1/nutrition/profile', payload, { token });
  },

  async getNutritionRecommendations(
    options: { num_meals?: number; date?: string } = {},
    token?: string | null
  ): Promise<NutritionRecommendResponse> {
    return apiClient.post<NutritionRecommendResponse>('/api/v1/nutrition/recommend', options, { token });
  },
};

export interface ExerciseCatalogItem {
  id: string;
  name: string;
  description?: string | null;
  muscle_group: string;
  equipment?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface CreateWorkoutInput {
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_public?: boolean;
  exercises?: Array<{
    exercise_id: string;
    order_index: number;
    target_sets: number;
    target_reps?: number | null;
    target_weight_kg?: number | null;
  }>;
}

export interface DailyFoodLogItem {
  id: string;
  user_id: string;
  log_date: string;
  meal_name: string;
  timing: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export interface CreateFoodLogInput {
  log_date?: string;
  meal_name: string;
  timing?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface Exercise1RMData {
  exerciseId: string;
  exerciseName: string;
  category: string;
  current1RM: number | null;
  historicalTrend: ChartDataPoint[];
}

export const calculate1RM = (weightKg?: number | null, reps?: number | null): number | null => {
  if (!weightKg || weightKg <= 0 || !reps || reps <= 0) return null;
  if (reps === 1) return Math.round(weightKg);
  // Epley formula: 1RM = weight * (1 + reps / 30)
  return Math.round(weightKg * (1 + reps / 30));
};

export const computeExercise1RMProgression = (
  sessions: (FullSessionItem | SessionItem)[],
  targetExercises: { name: string; category?: string }[] = [
    { name: 'Squat', category: 'BARBELL BACK SQUAT' },
    { name: 'Deadlift', category: 'CONVENTIONAL' },
    { name: 'Bench', category: 'FLAT BARBELL' },
  ]
): Exercise1RMData[] => {
  return targetExercises.map((target, idx) => {
    const matchingSets: { date: string; calculated1RM: number }[] = [];

    for (const session of sessions) {
      const full = session as FullSessionItem;
      if (full.exercises && Array.isArray(full.exercises)) {
        for (const ex of full.exercises) {
          const exName = (ex.exercise?.name || '').toLowerCase();
          if (exName.includes(target.name.toLowerCase())) {
            const val1RM = calculate1RM(ex.weight_kg, ex.reps);
            if (val1RM) {
              matchingSets.push({
                date: session.started_at,
                calculated1RM: val1RM,
              });
            }
          }
        }
      }
    }

    matchingSets.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const trend: ChartDataPoint[] = matchingSets.map((s, i) => {
      const d = new Date(s.date);
      return {
        id: `rm-${idx}-${i}`,
        date: d.toISOString().split('T')[0],
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        value: s.calculated1RM,
      };
    });

    const max1RM = matchingSets.length > 0 ? Math.max(...matchingSets.map((s) => s.calculated1RM)) : null;

    return {
      exerciseId: `target-ex-${idx}`,
      exerciseName: target.name,
      category: target.category || 'COMPOUND',
      current1RM: max1RM,
      historicalTrend: trend,
    };
  });
};

export type NutritionGoal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'general_health';
export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'custom';

export interface MealPlanItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: string[];
  timing?: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'pre_workout' | 'post_workout';
  prep_time_min?: number;
  description?: string;
}

export interface GeneratedMealPlan {
  date: string;
  total_calories: number;
  diet_type: string;
  goal: string;
  meals: MealPlanItem[];
}

export interface NutritionProfileData {
  id: string;
  user_id: string;
  goal: NutritionGoal;
  diet_type: DietType;
  allergies: string[] | null;
  daily_cal_target: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  meal_plan_json: GeneratedMealPlan | null;
  updated_at?: string;
  created_at?: string;
}

export interface NutritionRecommendResponse {
  saved: boolean;
  meal_plan: GeneratedMealPlan;
}

export const computeBMI = (
  height_cm?: number | null,
  weight_kg?: number | null
): { bmi: number | null; category: 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown' } => {
  if (
    height_cm === null ||
    height_cm === undefined ||
    weight_kg === null ||
    weight_kg === undefined ||
    !Number.isFinite(height_cm) ||
    !Number.isFinite(weight_kg) ||
    height_cm <= 0 ||
    weight_kg <= 0
  ) {
    return { bmi: null, category: 'unknown' };
  }

  const height_m = height_cm / 100;
  const rawBMI = weight_kg / (height_m * height_m);

  if (!Number.isFinite(rawBMI) || Number.isNaN(rawBMI) || rawBMI <= 0) {
    return { bmi: null, category: 'unknown' };
  }

  const bmi = Math.round(rawBMI * 10) / 10;
  let category: 'underweight' | 'normal' | 'overweight' | 'obese' = 'normal';

  if (bmi < 18.5) {
    category = 'underweight';
  } else if (bmi < 25.0) {
    category = 'normal';
  } else if (bmi < 30.0) {
    category = 'overweight';
  } else {
    category = 'obese';
  }

  return { bmi, category };
};


