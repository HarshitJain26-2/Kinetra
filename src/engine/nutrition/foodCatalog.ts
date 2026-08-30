/**
 * Kinetra Nutrition Engine — Food Catalog
 *
 * Deterministic food items catalog organized by diet type and meal timing.
 * Includes allergen tags for rule-based exclusion filtering.
 *
 * Framework-independent: no Express, Supabase, or external API calls.
 */

import type { DietType } from './types.js';

export interface CatalogFoodItem {
  name: string;
  allergens?: string[]; // e.g. ['gluten', 'dairy', 'nuts', 'soy', 'egg', 'seafood']
}

export interface MealOptionsByDiet {
  breakfast: CatalogFoodItem[][];
  lunch: CatalogFoodItem[][];
  snack: CatalogFoodItem[][];
  dinner: CatalogFoodItem[][];
}

export const FOOD_CATALOG: Record<DietType, MealOptionsByDiet> = {
  vegetarian: {
    breakfast: [
      [{ name: 'Paneer paratha', allergens: ['gluten', 'dairy'] }, { name: 'Greek yogurt', allergens: ['dairy'] }, { name: 'Banana shake', allergens: ['dairy'] }],
      [{ name: 'Oatmeal with chia seeds' }, { name: 'Almond butter', allergens: ['nuts'] }, { name: 'Sliced apple' }],
      [{ name: 'Tofu scramble', allergens: ['soy'] }, { name: 'Whole wheat toast', allergens: ['gluten'] }, { name: 'Avocado' }],
    ],
    lunch: [
      [{ name: 'Dal tadka' }, { name: 'Brown rice' }, { name: 'Steamed spinach' }, { name: 'Cucumber salad' }],
      [{ name: 'Paneer tikka masala', allergens: ['dairy'] }, { name: 'Quinoa' }, { name: 'Mixed vegetables' }],
      [{ name: 'Chickpea & avocado bowl' }, { name: 'Tahini dressing' }, { name: 'Roasted carrots' }],
    ],
    snack: [
      [{ name: 'Roasted makhana (fox nuts)' }, { name: 'Green tea' }],
      [{ name: 'Cottage cheese / paneer cubes', allergens: ['dairy'] }, { name: 'Walnuts', allergens: ['nuts'] }],
      [{ name: 'Hummus' }, { name: 'Carrot & cucumber sticks' }],
    ],
    dinner: [
      [{ name: 'Palak paneer', allergens: ['dairy'] }, { name: 'Roti', allergens: ['gluten'] }, { name: 'Sprouted moong salad' }],
      [{ name: 'Lentil soup' }, { name: 'Baked sweet potato' }, { name: 'Sauteed green beans' }],
      [{ name: 'Grilled tofu steak', allergens: ['soy'] }, { name: 'Steamed broccoli' }, { name: 'Mashed cauliflower' }],
    ],
  },

  vegan: {
    breakfast: [
      [{ name: 'Oatmeal with plant milk' }, { name: 'Chia seeds' }, { name: 'Fresh berries' }],
      [{ name: 'Tofu scramble with turmeric', allergens: ['soy'] }, { name: 'Avocado toast', allergens: ['gluten'] }],
      [{ name: 'Peanut butter banana smoothie', allergens: ['nuts', 'peanut'] }, { name: 'Hemp seeds' }],
    ],
    lunch: [
      [{ name: 'Lentil dal' }, { name: 'Brown rice' }, { name: 'Roasted broccoli' }],
      [{ name: 'Quinoa Buddha bowl' }, { name: 'Black beans' }, { name: 'Tahini dressing' }],
      [{ name: 'Tempeh stir-fry', allergens: ['soy'] }, { name: 'Edamame', allergens: ['soy'] }, { name: 'Steamed asparagus' }],
    ],
    snack: [
      [{ name: 'Hummus' }, { name: 'Celery and bell pepper sticks' }],
      [{ name: 'Handful of almonds & pumpkin seeds', allergens: ['nuts'] }],
      [{ name: 'Roasted chickpeas' }, { name: 'Coconut water' }],
    ],
    dinner: [
      [{ name: 'Chickpea curry' }, { name: 'Cauliflower rice' }, { name: 'Steamed kale' }],
      [{ name: 'Black bean and sweet potato skillet' }, { name: 'Guacamole' }],
      [{ name: 'Tofu and mixed vegetable stew', allergens: ['soy'] }, { name: 'Brown rice' }],
    ],
  },

  keto: {
    breakfast: [
      [{ name: 'Scrambled eggs in butter', allergens: ['egg', 'dairy'] }, { name: 'Avocado slices' }, { name: 'Crispy bacon' }],
      [{ name: 'Omelette with spinach & cheddar', allergens: ['egg', 'dairy'] }, { name: 'Mushroom saute' }],
      [{ name: 'Keto chia pudding with heavy cream', allergens: ['dairy'] }, { name: 'Pecan nuts', allergens: ['nuts'] }],
    ],
    lunch: [
      [{ name: 'Grilled chicken breast with olive oil' }, { name: 'Avocado salad' }, { name: 'Steamed broccoli' }],
      [{ name: 'Salmon fillet with herb butter', allergens: ['seafood', 'dairy'] }, { name: 'Asparagus spears' }],
      [{ name: 'Bunless beef burger with cheese', allergens: ['dairy'] }, { name: 'Cauliflower mash', allergens: ['dairy'] }],
    ],
    snack: [
      [{ name: 'Boiled eggs with sea salt', allergens: ['egg'] }],
      [{ name: 'Macadamia nuts & string cheese', allergens: ['nuts', 'dairy'] }],
      [{ name: 'Celery sticks with almond butter', allergens: ['nuts'] }],
    ],
    dinner: [
      [{ name: 'Pan-seared ribeye steak' }, { name: 'Sauteed zucchini noodles in butter', allergens: ['dairy'] }],
      [{ name: 'Baked chicken thighs with garlic herb rub' }, { name: 'Roasted Brussels sprouts in olive oil' }],
      [{ name: 'Pan-fried trout with lemon garlic butter', allergens: ['seafood', 'dairy'] }, { name: 'Spinach salad' }],
    ],
  },

  paleo: {
    breakfast: [
      [{ name: 'Poached eggs', allergens: ['egg'] }, { name: 'Smoked salmon', allergens: ['seafood'] }, { name: 'Avocado' }],
      [{ name: 'Turkey sausage' }, { name: 'Sauteed spinach' }, { name: 'Grapefruit halves' }],
      [{ name: 'Egg and vegetable frittata', allergens: ['egg'] }, { name: 'Sliced strawberries' }],
    ],
    lunch: [
      [{ name: 'Grilled chicken breast' }, { name: 'Sweet potato wedges' }, { name: 'Steamed broccoli' }],
      [{ name: 'Grass-fed ground beef bowl' }, { name: 'Cauliflower rice' }, { name: 'Avocado salsa' }],
      [{ name: 'Tuna salad with olive oil dressing', allergens: ['seafood'] }, { name: 'Cucumber & carrot sticks' }],
    ],
    snack: [
      [{ name: 'Raw almonds & walnuts', allergens: ['nuts'] }],
      [{ name: 'Beef jerky' }, { name: 'Apple slices' }],
      [{ name: 'Hard-boiled egg', allergens: ['egg'] }, { name: 'Guacamole' }],
    ],
    dinner: [
      [{ name: 'Grilled sirloin steak' }, { name: 'Roasted asparagus' }, { name: 'Baked acorn squash' }],
      [{ name: 'Roast chicken drumsticks' }, { name: 'Steamed green beans' }, { name: 'Mashed carrots' }],
      [{ name: 'Baked cod fillet with lemon herbs', allergens: ['seafood'] }, { name: 'Sauteed mushrooms & spinach' }],
    ],
  },

  omnivore: {
    breakfast: [
      [{ name: 'Oatmeal with whey protein & honey', allergens: ['dairy', 'gluten'] }, { name: 'Banana' }],
      [{ name: 'Scrambled eggs with toast', allergens: ['egg', 'gluten'] }, { name: 'Orange juice' }],
      [{ name: 'Greek yogurt with granola & berries', allergens: ['dairy', 'gluten'] }],
    ],
    lunch: [
      [{ name: 'Grilled chicken breast' }, { name: 'Brown rice' }, { name: 'Steamed broccoli' }],
      [{ name: 'Turkey wrap with hummus', allergens: ['gluten'] }, { name: 'Mixed green salad' }],
      [{ name: 'Salmon fillet with quinoa', allergens: ['seafood'] }, { name: 'Roasted zucchini' }],
    ],
    snack: [
      [{ name: 'Apple slices with peanut butter', allergens: ['nuts', 'peanut'] }],
      [{ name: 'Protein shake with milk', allergens: ['dairy'] }],
      [{ name: 'Trail mix (raisins & almonds)', allergens: ['nuts'] }],
    ],
    dinner: [
      [{ name: 'Lean beef sirloin' }, { name: 'Baked potato with olive oil' }, { name: 'Steamed green beans' }],
      [{ name: 'Roasted chicken thighs' }, { name: 'Wild rice' }, { name: 'Roasted carrots' }],
      [{ name: 'Grilled white fish', allergens: ['seafood'] }, { name: 'Couscous', allergens: ['gluten'] }, { name: 'Grilled asparagus' }],
    ],
  },

  custom: {
    breakfast: [
      [{ name: 'Balanced breakfast bowl with eggs and oats', allergens: ['egg', 'gluten'] }],
      [{ name: 'Fresh fruit with yogurt and nuts', allergens: ['dairy', 'nuts'] }],
    ],
    lunch: [
      [{ name: 'Grilled chicken breast' }, { name: 'Brown rice' }, { name: 'Steamed broccoli' }],
      [{ name: 'Tofu and quinoa power bowl', allergens: ['soy'] }, { name: 'Mixed vegetables' }],
    ],
    snack: [
      [{ name: 'Fresh fruit and mixed nuts', allergens: ['nuts'] }],
      [{ name: 'Hummus with vegetable sticks' }],
    ],
    dinner: [
      [{ name: 'Baked fish fillet with vegetables', allergens: ['seafood'] }, { name: 'Sweet potato' }],
      [{ name: 'Lentil and vegetable stew' }, { name: 'Brown rice' }],
    ],
  },
};

/**
 * Filter food items to exclude allergens if user specifies allergies.
 */
export function getFilteredMealItems(
  dietType: DietType,
  mealTiming: 'breakfast' | 'lunch' | 'snack' | 'dinner',
  allergies?: string[] | null
): string[] {
  const catalog = FOOD_CATALOG[dietType] || FOOD_CATALOG.omnivore;
  const options = catalog[mealTiming] || catalog.lunch;

  const normalizedAllergies = (allergies || []).map((a) => a.toLowerCase().trim());

  if (normalizedAllergies.length === 0) {
    // Return primary option
    return options[0].map((item) => item.name);
  }

  // Find the first option that has zero matching allergens
  for (const option of options) {
    const hasAllergen = option.some((item) =>
      (item.allergens || []).some((alg) =>
        normalizedAllergies.some((userAlg) => userAlg.includes(alg) || alg.includes(userAlg))
      )
    );

    if (!hasAllergen) {
      return option.map((item) => item.name);
    }
  }

  // Fallback: take first option but filter out individual matching items
  const filtered = options[0]
    .filter((item) =>
      !(item.allergens || []).some((alg) =>
        normalizedAllergies.some((userAlg) => userAlg.includes(alg) || alg.includes(userAlg))
      )
    )
    .map((item) => item.name);

  return filtered.length > 0 ? filtered : ['Fresh mixed garden salad with olive oil dressing'];
}
