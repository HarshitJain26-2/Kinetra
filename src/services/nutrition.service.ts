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

/**
 * Interface abstraction for pluggable AI recommendation providers
 */
export interface INutritionRecommendationProvider {
  generate(profile: NutritionProfileRow, options: NutritionRecommendationOptions): Promise<GeneratedMealPlan>;
}

/**
 * Deterministic fallback / baseline recommendation provider
 */
export class DeterministicNutritionProvider implements INutritionRecommendationProvider {
  async generate(profile: NutritionProfileRow, options: NutritionRecommendationOptions): Promise<GeneratedMealPlan> {
    const targetCal = profile.daily_cal_target || 2400;
    const targetProtein = profile.protein_g || 150;
    const targetCarbs = profile.carbs_g || 260;
    const targetFat = profile.fat_g || 70;
    const numMeals = options.num_meals || 4;

    const calPerMeal = Math.round(targetCal / numMeals);
    const proteinPerMeal = Math.round(targetProtein / numMeals);
    const carbsPerMeal = Math.round(targetCarbs / numMeals);
    const fatPerMeal = Math.round(targetFat / numMeals);

    const mealNames = ['Breakfast', 'Lunch', 'Pre-Workout Fuel', 'Dinner', 'Evening Snack'];
    const meals: MealPlanItem[] = Array.from({ length: numMeals }).map((_, i) => ({
      name: mealNames[i] || `Meal ${i + 1}`,
      calories: calPerMeal,
      protein_g: proteinPerMeal,
      carbs_g: carbsPerMeal,
      fat_g: fatPerMeal,
      items:
        profile.diet_type === 'vegetarian'
          ? ['Paneer paratha', 'Greek yogurt', 'Banana shake']
          : ['Grilled chicken breast', 'Brown rice', 'Steamed broccoli'],
    }));

    return {
      date: options.date || new Date().toISOString().split('T')[0],
      total_calories: targetCal,
      diet_type: profile.diet_type,
      goal: profile.goal,
      meals,
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
    const mealPlan = await this.recommendationProvider.generate(profile, options);

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

