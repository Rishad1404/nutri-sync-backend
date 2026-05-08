import { z } from "zod";

// --- Enums & Sub-schemas ---

const mealTypeEnum = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const mealPlanRecipeSchema = z.object({
  recipeId: z.string().cuid("Invalid Recipe ID"),
  day: z.number().int().min(1, "Day must be at least 1"),
  mealType: mealTypeEnum,
  servings: z.number().positive("Servings must be greater than 0").default(1),
});

const mealPlanBodyBase = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().optional(),
  startDate: z
    .string()
    .datetime({ message: "Invalid start date format (ISO 8601 required)" }),
  endDate: z
    .string()
    .datetime({ message: "Invalid end date format (ISO 8601 required)" }),
  totalCalorieGoal: z.number().int().positive("Calorie goal must be positive"),
  meals: z.any().optional(),
  recipes: z.array(mealPlanRecipeSchema).optional(),
});

export const createMealPlanSchema = z.object({
  body: mealPlanBodyBase.refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    },
  ),
});

export const updateMealPlanSchema = z.object({
  body: mealPlanBodyBase.partial(),
});

export const addRecipeToPlanSchema = z.object({
  body: mealPlanRecipeSchema,
});

// --- Types ---

export type CreateMealPlanInput = z.infer<typeof createMealPlanSchema>["body"];
export type UpdateMealPlanInput = z.infer<typeof updateMealPlanSchema>["body"];
export type AddRecipeToPlanInput = z.infer<
  typeof addRecipeToPlanSchema
>["body"];
