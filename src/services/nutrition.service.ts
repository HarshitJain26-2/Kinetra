import { supabaseAdmin } from '../config/supabase.js';
import { NotFoundError } from '../utils/errors.js';
import { NutritionProfileRow } from '../types/database.js';

export class NutritionService {
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
   * Upsert user nutrition targets
   */
  static async upsertProfile(
    userId: string,
    profileData: Partial<Omit<NutritionProfileRow, 'id' | 'user_id' | 'updated_at'>>
  ): Promise<NutritionProfileRow> {
    const { data, error } = await supabaseAdmin
      .from('nutrition_profiles')
      .upsert(
        {
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to upsert nutrition profile: ${error?.message}`);
    }

    return data;
  }

  /**
   * Generate an AI-tailored meal plan recommendation
   */
  static async generateRecommendation(
    userId: string,
    options: { num_meals?: number; date?: string }
  ): Promise<{ meal_plan: Record<string, any>; saved: boolean }> {
    const profile = await this.getProfile(userId);

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
    const meals = Array.from({ length: numMeals }).map((_, i) => ({
      name: mealNames[i] || `Meal ${i + 1}`,
      calories: calPerMeal,
      protein_g: proteinPerMeal,
      carbs_g: carbsPerMeal,
      fat_g: fatPerMeal,
      suggested_options:
        profile.diet_type === 'vegetarian'
          ? ['Paneer / Tofu Stir Fry', 'Oats with Greek Yogurt', 'Quinoa Lentil Bowl']
          : ['Grilled Chicken Breast', 'Egg White Omelette', 'Brown Rice & Salmon'],
    }));

    const mealPlan = {
      date: options.date || new Date().toISOString().split('T')[0],
      total_calories: targetCal,
      diet_type: profile.diet_type,
      goal: profile.goal,
      meals,
    };

    // Save generated plan back to profile
    await supabaseAdmin
      .from('nutrition_profiles')
      .update({
        meal_plan_json: mealPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return {
      meal_plan: mealPlan,
      saved: true,
    };
  }
}
