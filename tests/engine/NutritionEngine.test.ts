/**
 * Phase 21 — Nutrition Engine: Comprehensive Unit Tests
 *
 * Tests the following:
 *   - NutritionEngine.calculateBMI() (standard cases & degenerate/invalid inputs)
 *   - NutritionEngine.determineCalories() (explicit target override, goal modifiers, BMI modifiers, safety floor)
 *   - NutritionEngine.determineMacros() (manual macro overrides, goal ratios, keto ratios)
 *   - NutritionEngine.generateMeals() (diet types, meal count, allergen filtering)
 *   - NutritionEngine.recommend() (end-to-end determinism)
 *
 * Zero HTTP calls. Zero database calls. Pure synthetic data.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NutritionEngine } from '../../src/engine/nutrition/NutritionEngine.js';
import type { NutritionRecommendationInput } from '../../src/engine/nutrition/types.js';

describe('Phase 21: Nutrition Engine Unit Tests', () => {

  // ── SECTION 1: BMI Calculations ───────────────────────────────────────────

  it('TEST 1: Calculates BMI and categories accurately for normal, underweight, overweight, and obese', () => {
    // Normal: 70kg, 175cm -> BMI = 70 / (1.75^2) = 22.86 -> 22.9
    const normal = NutritionEngine.calculateBMI(175, 70);
    assert.equal(normal.bmi, 22.9);
    assert.equal(normal.category, 'normal');

    // Underweight: 45kg, 170cm -> BMI = 45 / (1.7^2) = 15.57 -> 15.6
    const under = NutritionEngine.calculateBMI(170, 45);
    assert.equal(under.bmi, 15.6);
    assert.equal(under.category, 'underweight');

    // Overweight: 85kg, 175cm -> BMI = 85 / (1.75^2) = 27.76 -> 27.8
    const over = NutritionEngine.calculateBMI(175, 85);
    assert.equal(over.bmi, 27.8);
    assert.equal(over.category, 'overweight');

    // Obese: 105kg, 175cm -> BMI = 105 / (1.75^2) = 34.29 -> 34.3
    const obese = NutritionEngine.calculateBMI(175, 105);
    assert.equal(obese.bmi, 34.3);
    assert.equal(obese.category, 'obese');
  });

  it('TEST 2: Degenerate BMI inputs safely return null and category unknown without throwing', () => {
    assert.deepEqual(NutritionEngine.calculateBMI(null, 70), { bmi: null, category: 'unknown' });
    assert.deepEqual(NutritionEngine.calculateBMI(175, null), { bmi: null, category: 'unknown' });
    assert.deepEqual(NutritionEngine.calculateBMI(0, 70), { bmi: null, category: 'unknown' });
    assert.deepEqual(NutritionEngine.calculateBMI(-175, 70), { bmi: null, category: 'unknown' });
    assert.deepEqual(NutritionEngine.calculateBMI(175, -70), { bmi: null, category: 'unknown' });
    assert.deepEqual(NutritionEngine.calculateBMI(NaN, 70), { bmi: null, category: 'unknown' });
    assert.deepEqual(NutritionEngine.calculateBMI(175, Infinity), { bmi: null, category: 'unknown' });
  });

  // ── SECTION 2: Calorie Target Derivation & Precedence ─────────────────────

  it('TEST 3: Explicit daily_cal_target override takes 100% precedence', () => {
    const input: NutritionRecommendationInput = {
      height_cm: 175,
      weight_kg: 70,
      goal: 'lose_weight',
      diet_type: 'omnivore',
      daily_cal_target: 2850,
    };
    const bmiResult = NutritionEngine.calculateBMI(input.height_cm, input.weight_kg);
    const calories = NutritionEngine.determineCalories(input, bmiResult);
    assert.equal(calories, 2850);
  });

  it('TEST 4: Goal adjustments (lose_weight deficit, gain_muscle surplus, maintain) apply when daily_cal_target is null', () => {
    // 70kg, 175cm -> normal BMI -> base = 70 * 30 = 2100 kcal
    const baseInput: NutritionRecommendationInput = {
      height_cm: 175,
      weight_kg: 70,
      goal: 'maintain',
      diet_type: 'omnivore',
    };
    const bmi = NutritionEngine.calculateBMI(175, 70);

    const maintainCal = NutritionEngine.determineCalories({ ...baseInput, goal: 'maintain' }, bmi);
    assert.equal(maintainCal, 2100);

    const loseCal = NutritionEngine.determineCalories({ ...baseInput, goal: 'lose_weight' }, bmi);
    assert.equal(loseCal, 1700); // 2100 - 400

    const gainCal = NutritionEngine.determineCalories({ ...baseInput, goal: 'gain_muscle' }, bmi);
    assert.equal(gainCal, 2500); // 2100 + 400
  });

  it('TEST 5: Calorie target enforces 1200 kcal safety floor', () => {
    // Very low weight + lose_weight would otherwise calculate < 1200
    const input: NutritionRecommendationInput = {
      height_cm: 150,
      weight_kg: 40, // 40 * 30 = 1200 - 400 = 800
      goal: 'lose_weight',
      diet_type: 'omnivore',
    };
    const bmi = NutritionEngine.calculateBMI(input.height_cm, input.weight_kg);
    const calories = NutritionEngine.determineCalories(input, bmi);
    assert.equal(calories, 1200, 'Must enforce minimum safety floor of 1200 kcal');
  });

  // ── SECTION 3: Macro Targets & Manual Overrides ───────────────────────────

  it('TEST 6: Manual macro overrides take precedence over calculated ratios', () => {
    const input: NutritionRecommendationInput = {
      goal: 'gain_muscle',
      diet_type: 'omnivore',
      daily_cal_target: 2400,
      protein_g: 200, // manual override
      carbs_g: 250,   // manual override
      // fat_g is omitted -> calculated
    };
    const macros = NutritionEngine.determineMacros(2400, input);
    assert.equal(macros.protein_g, 200);
    assert.equal(macros.carbs_g, 250);
    assert.equal(macros.fat_g, Math.round((2400 * 0.25) / 9)); // calculated: 67g
  });

  it('TEST 7: Calculated macro ratios differ appropriately by goal and keto diet', () => {
    const cal = 2000;

    // Standard maintain (25% P, 50% C, 25% F)
    const mMaintain = NutritionEngine.determineMacros(cal, { goal: 'maintain', diet_type: 'omnivore' });
    assert.equal(mMaintain.protein_g, 125); // (2000*0.25)/4
    assert.equal(mMaintain.carbs_g, 250);   // (2000*0.50)/4
    assert.equal(mMaintain.fat_g, 56);      // (2000*0.25)/9

    // Lose weight (35% P, 35% C, 30% F)
    const mLose = NutritionEngine.determineMacros(cal, { goal: 'lose_weight', diet_type: 'omnivore' });
    assert.equal(mLose.protein_g, 175); // (2000*0.35)/4
    assert.equal(mLose.carbs_g, 175);   // (2000*0.35)/4
    assert.equal(mLose.fat_g, 67);      // (2000*0.30)/9

    // Keto (25% P, 5% C, 70% F)
    const mKeto = NutritionEngine.determineMacros(cal, { goal: 'maintain', diet_type: 'keto' });
    assert.equal(mKeto.protein_g, 125); // (2000*0.25)/4
    assert.equal(mKeto.carbs_g, 25);    // (2000*0.05)/4
    assert.equal(mKeto.fat_g, 156);     // (2000*0.70)/9
  });

  // ── SECTION 4: Meals & Diet Types ─────────────────────────────────────────

  it('TEST 8: Generates diet-specific meals across vegetarian, vegan, keto, paleo, and omnivore', () => {
    const diets = ['vegetarian', 'vegan', 'keto', 'paleo', 'omnivore'] as const;

    for (const diet of diets) {
      const output = NutritionEngine.recommend({
        goal: 'maintain',
        diet_type: diet,
        daily_cal_target: 2000,
        num_meals: 4,
      });

      assert.equal(output.meals.length, 4);
      assert.equal(output.diet_type, diet);
      assert.ok(output.meals[0].items.length > 0);
      assert.equal(output.meals[0].name, 'Breakfast');
      assert.equal(output.meals[1].name, 'Lunch');
      assert.equal(output.meals[2].name, 'Pre-Workout Fuel');
      assert.equal(output.meals[3].name, 'Dinner');
    }
  });

  it('TEST 9: Allergen exclusion filtering prevents tagged allergens from appearing in meal suggestions', () => {
    // Vegetarian breakfast with gluten allergy should select alternative option without gluten
    const outputGlutenFree = NutritionEngine.recommend({
      goal: 'maintain',
      diet_type: 'vegetarian',
      daily_cal_target: 2000,
      allergies: ['gluten', 'dairy'],
      num_meals: 1,
    });

    const items = outputGlutenFree.meals[0].items;
    // Paneer paratha has gluten + dairy, so it should pick Oatmeal with chia seeds or Tofu scramble without gluten
    assert.ok(!items.includes('Paneer paratha'));
  });

  it('TEST 10: NutritionEngine.recommend() is 100% deterministic — same input produces identical output', () => {
    const input: NutritionRecommendationInput = {
      height_cm: 180,
      weight_kg: 80,
      goal: 'gain_muscle',
      diet_type: 'vegetarian',
      date: '2026-08-30',
      num_meals: 4,
    };

    const out1 = NutritionEngine.recommend(input);
    const out2 = NutritionEngine.recommend(input);

    assert.deepEqual(out1, out2);
    assert.equal(out1.total_calories, 2800); // 80 * 30 = 2400 + 400 (gain) = 2800
    assert.equal(out1.bmi, 24.7);
    assert.equal(out1.bmi_category, 'normal');
  });

});
