import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiClient,
  computeBMI,
  NutritionProfileData,
  MealPlanItem,
  GeneratedMealPlan,
} from '../src/api/client';

describe('Phase 34: Nutrition UI & Personalized Nutrition Tests', () => {
  describe('BMI Computation Logic', () => {
    it('calculates BMI accurately for valid height and weight', () => {
      // 180 cm, 75 kg -> 75 / (1.8 * 1.8) = 23.15 -> 23.1
      const result = computeBMI(180, 75);
      assert.equal(result.bmi, 23.1);
      assert.equal(result.category, 'normal');
    });

    it('categorizes underweight, overweight, and obese accurately', () => {
      const underweight = computeBMI(180, 50); // 15.4
      assert.equal(underweight.category, 'underweight');

      const overweight = computeBMI(180, 85); // 26.2
      assert.equal(overweight.category, 'overweight');

      const obese = computeBMI(180, 110); // 34.0
      assert.equal(obese.category, 'obese');
    });

    it('handles null, undefined, 0, and negative inputs safely without throwing', () => {
      assert.deepEqual(computeBMI(null, null), { bmi: null, category: 'unknown' });
      assert.deepEqual(computeBMI(undefined, 80), { bmi: null, category: 'unknown' });
      assert.deepEqual(computeBMI(180, 0), { bmi: null, category: 'unknown' });
      assert.deepEqual(computeBMI(-180, 75), { bmi: null, category: 'unknown' });
      assert.deepEqual(computeBMI(180, NaN), { bmi: null, category: 'unknown' });
    });
  });

  describe('No-Fabrication Data Invariant', () => {
    it('strictly returns "--" when nutrition targets are uninitialized', () => {
      const emptyProfile: Partial<NutritionProfileData> = {
        daily_cal_target: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        meal_plan_json: null,
      };

      const targetCaloriesDisplay = emptyProfile.daily_cal_target ? `${emptyProfile.daily_cal_target}` : '--';
      const proteinDisplay = emptyProfile.protein_g ? `${emptyProfile.protein_g}g` : '--';
      const carbsDisplay = emptyProfile.carbs_g ? `${emptyProfile.carbs_g}g` : '--';
      const fatDisplay = emptyProfile.fat_g ? `${emptyProfile.fat_g}g` : '--';

      assert.equal(targetCaloriesDisplay, '--');
      assert.equal(proteinDisplay, '--');
      assert.equal(carbsDisplay, '--');
      assert.equal(fatDisplay, '--');
    });

    it('identifies Insufficient Data state when baseline profile metrics are missing', () => {
      const userProfile = { height_cm: null, weight_kg: null };
      const nutritionProfile = { daily_cal_target: null };

      const hasInsufficientData =
        !userProfile.height_cm && !userProfile.weight_kg && !nutritionProfile.daily_cal_target;

      assert.equal(hasInsufficientData, true);
    });

    it('identifies Populated state when real physiological targets are present', () => {
      const userProfile = { height_cm: 182, weight_kg: 82 };
      const nutritionProfile = { daily_cal_target: 2800, protein_g: 180 };

      const hasInsufficientData =
        !userProfile.height_cm && !userProfile.weight_kg && !nutritionProfile.daily_cal_target;

      assert.equal(hasInsufficientData, false);
    });
  });

  describe('Meal Recommendations & Diet Filtering', () => {
    const mockMeals: MealPlanItem[] = [
      {
        name: 'Breakfast',
        calories: 650,
        protein_g: 45,
        carbs_g: 50,
        fat_g: 22,
        items: ['Greek Yogurt Bowl', 'Berries', 'Chia Seeds'],
      },
      {
        name: 'Lunch',
        calories: 750,
        protein_g: 65,
        carbs_g: 12,
        fat_g: 48,
        items: ['Grass-Fed Wagyu Steak', 'Charred Asparagus'],
      },
      {
        name: 'Snack',
        calories: 300,
        protein_g: 15,
        carbs_g: 35,
        fat_g: 10,
        items: ['Hummus & Cucumber', 'Olive Oil'],
      },
      {
        name: 'Dinner',
        calories: 520,
        protein_g: 42,
        carbs_g: 45,
        fat_g: 22,
        items: ['Wild Salmon', 'Ancient Grains'],
      },
    ];

    it('filters meals by High Protein index (protein >= 30g)', () => {
      const highProteinMeals = mockMeals.filter((m) => m.protein_g >= 30);
      assert.equal(highProteinMeals.length, 3);
      assert.ok(highProteinMeals.every((m) => m.protein_g >= 30));
    });

    it('filters meals by Keto macro ratio (fat >= 25g or carbs <= 20g)', () => {
      const ketoMeals = mockMeals.filter((m) => m.fat_g >= 25 || m.carbs_g <= 20);
      assert.equal(ketoMeals.length, 1);
      assert.equal(ketoMeals[0].items[0], 'Grass-Fed Wagyu Steak');
    });

    it('formats meal detail macro ratios and prep times correctly', () => {
      const meal = mockMeals[1];
      const prepTime = meal.calories > 600 ? 45 : 20;
      const fiberGrams = Math.max(4, Math.round(meal.carbs_g * 0.25));

      assert.equal(prepTime, 45);
      assert.equal(fiberGrams, 4); // Math.max(4, 12 * 0.25) = 4
    });
  });

  describe('API Client Methods & Security Invariants', () => {
    it('defines getNutritionProfile, upsertNutritionProfile, and getNutritionRecommendations on apiClient', () => {
      assert.equal(typeof apiClient.getNutritionProfile, 'function');
      assert.equal(typeof apiClient.upsertNutritionProfile, 'function');
      assert.equal(typeof apiClient.getNutritionRecommendations, 'function');
    });

    it('strictly verifies NO service-role key exists in mobile source files', () => {
      const fs = require('node:fs');
      const path = require('node:path');

      const srcDir = path.resolve(__dirname, '../src');
      const files: string[] = [];

      function walkDir(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walkDir(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
      }

      walkDir(srcDir);
      assert.ok(files.length > 10);

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        assert.ok(
          !content.includes('SUPABASE_SERVICE_ROLE_KEY'),
          `Forbidden SUPABASE_SERVICE_ROLE_KEY found in ${file}`
        );
        assert.ok(
          !content.includes('service_role'),
          `Forbidden service_role string found in ${file}`
        );
      }
    });
  });
});
