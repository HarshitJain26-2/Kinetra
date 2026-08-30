import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError, InternalServerError } from '../utils/errors.js';
import { NutritionProfileRow } from '../types/database.js';

export const ALLOWED_NUTRITION_UPDATE_FIELDS = [
  'goal',
  'diet_type',
  'allergies',
  'daily_cal_target',
  'protein_g',
  'carbs_g',
  'fat_g',
] as const;

export interface NutritionRecommendationOptions {
  num_meals?: number;
  date?: string;
}

export interface MealPlanItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: string[];
}

export interface GeneratedMealPlan {
  date: string;
  total_calories: number;
  diet_type: string;
  goal: string;
  meals: MealPlanItem[];
}

import { NutritionEngine } from '../engine/nutrition/NutritionEngine.js';
import { UsersService } from './users.service.js';

export interface NutritionUserContext {
  height_cm?: number | null;
  weight_kg?: number | null;
}

/**
 * Interface abstraction for pluggable AI recommendation providers
 */
export interface INutritionRecommendationProvider {
  generate(
    profile: NutritionProfileRow,
    options: NutritionRecommendationOptions,
    userContext?: NutritionUserContext | null
  ): Promise<GeneratedMealPlan>;
}

/**
 * Deterministic fallback / baseline recommendation provider
 * Delegates pure rule-based calculation to NutritionEngine
 */
export class DeterministicNutritionProvider implements INutritionRecommendationProvider {
  async generate(
    profile: NutritionProfileRow,
    options: NutritionRecommendationOptions,
    userContext?: NutritionUserContext | null
  ): Promise<GeneratedMealPlan> {
    const result = NutritionEngine.recommend({
      height_cm: userContext?.height_cm,
      weight_kg: userContext?.weight_kg,
      goal: profile.goal,
      diet_type: profile.diet_type,
      allergies: profile.allergies,
      daily_cal_target: profile.daily_cal_target,
      protein_g: profile.protein_g,
      carbs_g: profile.carbs_g,
      fat_g: profile.fat_g,
      num_meals: options.num_meals,
      date: options.date,
    });

    return {
      date: result.date,
      total_calories: result.total_calories,
      diet_type: result.diet_type,
      goal: result.goal,
      meals: result.meals,
    };
  }
}

export class NutritionService {
  private static recommendationProvider: INutritionRecommendationProvider = new DeterministicNutritionProvider();

  /**
   * Set custom recommendation provider (for future AI expansion)
   */
  static setRecommendationProvider(provider: INutritionRecommendationProvider): void {
    this.recommendationProvider = provider;
  }

  /**
   * Get user's nutrition profile
   */
  static async getProfile(userId: string): Promise<NutritionProfileRow> {
    const { data, error } = await supabaseAdmin
      .from('nutrition_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Nutrition profile not found', 'NUTRITION_PROFILE_NOT_FOUND');
    }

    return data;
  }

  /**
   * Upsert user nutrition targets with explicit field allowlist
   */
  static async upsertProfile(
    userId: string,
    profileData: Partial<Omit<NutritionProfileRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<NutritionProfileRow> {
    const sanitizedData: Record<string, any> = {};
    for (const key of ALLOWED_NUTRITION_UPDATE_FIELDS) {
      if (key in profileData && (profileData as any)[key] !== undefined) {
        sanitizedData[key] = (profileData as any)[key];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('nutrition_profiles')
      .upsert(
        {
          user_id: userId,
          ...sanitizedData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerError(`Failed to upsert nutrition profile: ${error?.message}`);
    }

    return data;
  }

  /**
   * Generate meal plan recommendation using provider abstraction
   */
  static async generateRecommendation(
    userId: string,
    options: NutritionRecommendationOptions
  ): Promise<{ meal_plan: GeneratedMealPlan; saved: boolean }> {
    const profile = await this.getProfile(userId);

    let userContext: NutritionUserContext | null = null;
    try {
      const user = await UsersService.getCurrentUserProfile(userId);
      if (user) {
        userContext = {
          height_cm: user.height_cm,
          weight_kg: user.weight_kg,
        };
      }
    } catch {
      // Gracefully continue without user metrics if user record is uninitialized/unmocked
      userContext = null;
    }

    const mealPlan = await this.recommendationProvider.generate(profile, options, userContext);

    // Save generated plan back to profile
    const { error: saveError } = await supabaseAdmin
      .from('nutrition_profiles')
      .update({
        meal_plan_json: mealPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (saveError) {
      throw new InternalServerError('Failed to save generated meal plan');
    }

    return {
      meal_plan: mealPlan,
      saved: true,
    };
  }
}

