/**
 * Kinetra Nutrition Engine — Type Definitions
 *
 * Framework-independent.
 * No imports from Express, Supabase, HTTP, or database libraries.
 */

export type NutritionGoal = 'lose_weight' | 'maintain' | 'gain_muscle' | 'general_health';

export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'custom';

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown';

export interface BMIResult {
  /** Numerical Body Mass Index (kg/m^2), rounded to 1 decimal place, or null if biometrics are missing/invalid */
  bmi: number | null;
  /** Categorical BMI classification */
  category: BMICategory;
}

export interface MacroTargets {
  /** Total daily calories (kcal) */
  calories: number;
  /** Daily protein target in grams */
  protein_g: number;
  /** Daily carbohydrate target in grams */
  carbs_g: number;
  /** Daily fat target in grams */
  fat_g: number;
}

export interface MealPlanItem {
  /** Meal name (e.g. "Breakfast", "Lunch", "Pre-Workout Fuel", "Dinner") */
  name: string;
  /** Calories allocated to this meal */
  calories: number;
  /** Protein allocated to this meal (g) */
  protein_g: number;
  /** Carbohydrates allocated to this meal (g) */
  carbs_g: number;
  /** Fat allocated to this meal (g) */
  fat_g: number;
  /** Suggested food items */
  items: string[];
}

export interface NutritionRecommendationInput {
  /** Height in centimetres (optional) */
  height_cm?: number | null;
  /** Weight in kilograms (optional) */
  weight_kg?: number | null;
  /** User's fitness/dietary goal */
  goal: NutritionGoal;
  /** User's dietary preference */
  diet_type: DietType;
  /** List of user allergies/exclusions */
  allergies?: string[] | null;
  /** User-configured explicit calorie target override (takes precedence if present) */
  daily_cal_target?: number | null;
  /** User-configured explicit protein target override (g) */
  protein_g?: number | null;
  /** User-configured explicit carbohydrate target override (g) */
  carbs_g?: number | null;
  /** User-configured explicit fat target override (g) */
  fat_g?: number | null;
  /** Number of meals per day (default: 4, min: 1, max: 8) */
  num_meals?: number;
  /** Recommendation date in ISO format YYYY-MM-DD */
  date?: string;
}

export interface NutritionRecommendationOutput {
  /** ISO date YYYY-MM-DD */
  date: string;
  /** Numerical BMI or null if biometrics unavailable */
  bmi: number | null;
  /** BMI category */
  bmi_category: BMICategory;
  /** Total daily calories (kcal) */
  total_calories: number;
  /** Macro breakdown in grams */
  targets: MacroTargets;
  /** Dietary preference applied */
  diet_type: DietType;
  /** Goal applied */
  goal: NutritionGoal;
  /** Meal plan items */
  meals: MealPlanItem[];
}
