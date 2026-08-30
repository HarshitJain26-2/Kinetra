/**
 * Kinetra Nutrition Engine — Standalone Recommender
 *
 * Framework-independent rule-based engine:
 *   Goal + BMI + Diet Type → Calorie Target + Macro Breakdown + Meal Plan
 *
 * NO imports from:
 *   - express / any HTTP library
 *   - @supabase/supabase-js
 *   - database clients or services
 *   - external LLM / AI APIs
 */

import type {
  NutritionRecommendationInput,
  NutritionRecommendationOutput,
  BMIResult,
  MacroTargets,
  MealPlanItem,
  BMICategory,
} from './types.js';

import { getFilteredMealItems } from './foodCatalog.js';

export class NutritionEngine {
  /**
   * Calculate Body Mass Index (BMI) and categorization from height and weight.
   *
   * Formula: BMI = weight_kg / (height_m ^ 2)
   *
   * Handles null, undefined, zero, negative, NaN, and Infinity safely.
   */
  static calculateBMI(height_cm?: number | null, weight_kg?: number | null): BMIResult {
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
    let category: BMICategory = 'normal';

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
  }

  /**
   * Determine daily calorie target.
   *
   * PRECEDENCE:
   *   1. If `input.daily_cal_target` is explicitly set (> 0), it takes 100% precedence.
   *   2. Otherwise, calculate deterministic baseline from bodyweight & BMI + goal adjustment.
   *
   * Baseline rules:
   *   - If weight is available: 30 kcal/kg baseline.
   *   - If weight is unavailable: 2200 kcal fallback baseline.
   *   - BMI modifier: underweight (+200), normal (0), overweight (-200), obese (-400).
   *   - Goal modifier: lose_weight (-400, floor 1200), gain_muscle (+400), maintain (0), general_health (0).
   */
  static determineCalories(input: NutritionRecommendationInput, bmiResult: BMIResult): number {
    if (
      input.daily_cal_target !== null &&
      input.daily_cal_target !== undefined &&
      Number.isFinite(input.daily_cal_target) &&
      input.daily_cal_target > 0
    ) {
      return Math.round(input.daily_cal_target);
    }

    let base = 2200;
    if (
      input.weight_kg !== null &&
      input.weight_kg !== undefined &&
      Number.isFinite(input.weight_kg) &&
      input.weight_kg > 0
    ) {
      base = input.weight_kg * 30;
    }

    // BMI modifier
    let bmiMod = 0;
    switch (bmiResult.category) {
      case 'underweight':
        bmiMod = 200;
        break;
      case 'overweight':
        bmiMod = -200;
        break;
      case 'obese':
        bmiMod = -400;
        break;
      default:
        bmiMod = 0;
        break;
    }

    // Goal modifier
    let goalMod = 0;
    switch (input.goal) {
      case 'lose_weight':
        goalMod = -400;
        break;
      case 'gain_muscle':
        goalMod = 400;
        break;
      case 'maintain':
      case 'general_health':
      default:
        goalMod = 0;
        break;
    }

    const calculated = Math.round(base + bmiMod + goalMod);
    // Enforce safety floor of 1200 kcal
    return Math.max(1200, calculated);
  }

  /**
   * Determine daily macronutrient targets (Protein, Carbs, Fat).
   *
   * PRECEDENCE:
   *   Individual manual overrides (`protein_g`, `carbs_g`, `fat_g`) take precedence if provided.
   *   Unspecified macros are calculated using deterministic caloric percentage ratios.
   */
  static determineMacros(calories: number, input: NutritionRecommendationInput): MacroTargets {
    // 1. Calculate default ratios
    let proteinRatio = 0.25;
    let carbsRatio = 0.50;
    let fatRatio = 0.25;

    if (input.diet_type === 'keto') {
      proteinRatio = 0.25;
      carbsRatio = 0.05;
      fatRatio = 0.70;
    } else if (input.goal === 'lose_weight') {
      proteinRatio = 0.35;
      carbsRatio = 0.35;
      fatRatio = 0.30;
    } else if (input.goal === 'gain_muscle') {
      proteinRatio = 0.30;
      carbsRatio = 0.45;
      fatRatio = 0.25;
    }

    // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fat: 9 kcal/g
    const defaultProtein = Math.round((calories * proteinRatio) / 4);
    const defaultCarbs = Math.round((calories * carbsRatio) / 4);
    const defaultFat = Math.round((calories * fatRatio) / 9);

    const protein_g =
      input.protein_g !== null && input.protein_g !== undefined && Number.isFinite(input.protein_g) && input.protein_g >= 0
        ? Math.round(input.protein_g)
        : defaultProtein;

    const carbs_g =
      input.carbs_g !== null && input.carbs_g !== undefined && Number.isFinite(input.carbs_g) && input.carbs_g >= 0
        ? Math.round(input.carbs_g)
        : defaultCarbs;

    const fat_g =
      input.fat_g !== null && input.fat_g !== undefined && Number.isFinite(input.fat_g) && input.fat_g >= 0
        ? Math.round(input.fat_g)
        : defaultFat;

    return {
      calories,
      protein_g,
      carbs_g,
      fat_g,
    };
  }

  /**
   * Distribute daily calories and macros across scheduled meals with diet-compatible suggestions.
   */
  static generateMeals(
    calories: number,
    macros: MacroTargets,
    input: NutritionRecommendationInput
  ): MealPlanItem[] {
    const numMeals = Math.min(8, Math.max(1, input.num_meals || 4));

    const calPerMeal = Math.round(calories / numMeals);
    const proteinPerMeal = Math.round(macros.protein_g / numMeals);
    const carbsPerMeal = Math.round(macros.carbs_g / numMeals);
    const fatPerMeal = Math.round(macros.fat_g / numMeals);

    const mealTimingMap: ('breakfast' | 'lunch' | 'snack' | 'dinner')[] = [
      'breakfast',
      'lunch',
      'snack',
      'dinner',
      'snack',
      'breakfast',
      'snack',
      'dinner',
    ];

    const mealNames = [
      'Breakfast',
      'Lunch',
      'Pre-Workout Fuel',
      'Dinner',
      'Evening Snack',
      'Morning Snack',
      'Post-Workout Shake',
      'Late Snack',
    ];

    const meals: MealPlanItem[] = Array.from({ length: numMeals }).map((_, i) => {
      const timing = mealTimingMap[i] || 'lunch';
      const items = getFilteredMealItems(input.diet_type, timing, input.allergies);

      return {
        name: mealNames[i] || `Meal ${i + 1}`,
        calories: calPerMeal,
        protein_g: proteinPerMeal,
        carbs_g: carbsPerMeal,
        fat_g: fatPerMeal,
        items,
      };
    });

    return meals;
  }

  /**
   * Pure deterministic entrypoint for nutrition recommendation generation.
   *
   * @param input - Normalised user nutrition/profile inputs
   * @returns Complete NutritionRecommendationOutput
   */
  static recommend(input: NutritionRecommendationInput): NutritionRecommendationOutput {
    // 1. Calculate BMI
    const bmiResult = this.calculateBMI(input.height_cm, input.weight_kg);

    // 2. Determine Calories
    const total_calories = this.determineCalories(input, bmiResult);

    // 3. Determine Macros
    const targets = this.determineMacros(total_calories, input);

    // 4. Generate Meals
    const meals = this.generateMeals(total_calories, targets, input);

    const date = input.date || new Date().toISOString().split('T')[0];

    return {
      date,
      bmi: bmiResult.bmi,
      bmi_category: bmiResult.category,
      total_calories,
      targets,
      diet_type: input.diet_type,
      goal: input.goal,
      meals,
    };
  }
}
