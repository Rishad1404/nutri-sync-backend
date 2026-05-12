import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"), // e.g., grams, cups, tbsp
  caloriesPerUnit: z.number().nonnegative().optional(),
});

const stepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(10, "Instruction must be at least 10 characters"),
});

const nutritionSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().optional(),
});

export const createRecipeSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    cookTime: z.number().int().positive("Cook time must be a positive integer"),
    prepTime: z.number().int().nonnegative("Prep time cannot be negative"),
    servings: z.number().int().positive("Servings must be at least 1"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    cuisine: z.string().min(1, "Cuisine type is required"),
    category: z.enum(["breakfast", "lunch", "dinner", "snack", "dessert"]),
    imageUrl: z.string().optional(),

    ingredients: z
      .array(ingredientSchema)
      .min(1, "At least one ingredient is required"),
    steps: z.array(stepSchema).min(1, "At least one step is required"),
    nutrition: nutritionSchema.optional(),

    isPublished: z.boolean().optional().default(false),
  }),
});

export const updateRecipeSchema = z.object({
  body: createRecipeSchema.shape.body.partial(),
});

export const recipeQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    search: z.string().optional(),
    cuisine: z.string().optional(),
    difficulty: z
      .string()
      .optional()
      .transform((val) => val?.toLowerCase()),
    category: z
      .string()
      .optional()
      .transform((val) => val?.toLowerCase()),
    createdById: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "rating", "cookTime", "viewCount"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>["body"];
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>["body"];
export type RecipeFilters = z.infer<typeof recipeQuerySchema>["query"];
