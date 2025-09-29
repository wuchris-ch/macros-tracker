export interface FoodTestCase {
  description: string;
  expectedCalories: number;
  expectedConfidence?: number;
  category?: string;
}

export const validFoodDescriptions: FoodTestCase[] = [
  {
    description: "1 medium apple",
    expectedCalories: 95,
    expectedConfidence: 0.9,
    category: "fruit"
  },
  {
    description: "2 slices of whole wheat bread with peanut butter",
    expectedCalories: 320,
    expectedConfidence: 0.8,
    category: "sandwich"
  },
  {
    description: "Large Caesar salad with grilled chicken",
    expectedCalories: 470,
    expectedConfidence: 0.75,
    category: "salad"
  },
  {
    description: "1 cup of cooked white rice",
    expectedCalories: 205,
    expectedConfidence: 0.85,
    category: "grain"
  },
  {
    description: "Medium banana",
    expectedCalories: 105,
    expectedConfidence: 0.9,
    category: "fruit"
  },
  {
    description: "8oz grilled salmon fillet",
    expectedCalories: 412,
    expectedConfidence: 0.8,
    category: "protein"
  },
  {
    description: "1 cup of steamed broccoli",
    expectedCalories: 55,
    expectedConfidence: 0.85,
    category: "vegetable"
  },
  {
    description: "12oz can of Coca-Cola",
    expectedCalories: 140,
    expectedConfidence: 0.95,
    category: "beverage"
  }
];

export const ambiguousFoodDescriptions: FoodTestCase[] = [
  {
    description: "pasta",
    expectedCalories: 220,
    expectedConfidence: 0.5,
    category: "ambiguous"
  },
  {
    description: "salad",
    expectedCalories: 150,
    expectedConfidence: 0.4,
    category: "ambiguous"
  },
  {
    description: "sandwich",
    expectedCalories: 300,
    expectedConfidence: 0.3,
    category: "ambiguous"
  }
];

export const invalidFoodDescriptions: string[] = [
  "",
  "   ",
  "123456789",
  "!@#$%^&*()",
  "not food at all",
  "random gibberish text that doesn't describe food"
];

export const complexFoodDescriptions: FoodTestCase[] = [
  {
    description: "Homemade lasagna with ground beef, ricotta, mozzarella, and marinara sauce, approximately 4x4 inch serving",
    expectedCalories: 450,
    expectedConfidence: 0.7,
    category: "complex"
  },
  {
    description: "Stir-fry with mixed vegetables (bell peppers, broccoli, carrots, snap peas), tofu, and brown rice with soy sauce",
    expectedCalories: 380,
    expectedConfidence: 0.65,
    category: "complex"
  },
  {
    description: "Smoothie made with 1 banana, 1 cup spinach, 1/2 cup blueberries, 1 cup almond milk, and 1 tbsp chia seeds",
    expectedCalories: 285,
    expectedConfidence: 0.8,
    category: "complex"
  }
];