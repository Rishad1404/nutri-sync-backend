/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { PrismaQueryBuilder } from "../../shared/utils/query-builder";
import type { IRequestUser } from "../auth/auth.type";
import type {
  CreateMealPlanInput,
  UpdateMealPlanInput,
} from "./meal-plan.type";

const createMealPlan = async (
  user: IRequestUser,
  payload: CreateMealPlanInput,
) => {
  // Use a transaction to ensure the plan and its relational recipes are saved together safely
  const result = await prisma.$transaction(async (tx) => {
    const mealPlan = await tx.mealPlan.create({
      data: {
        title: payload.title,
        description: payload.description,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        totalCalorieGoal: payload.totalCalorieGoal,
        userId: user.id,
        meals: payload.meals ? (payload.meals as any) : {},

        // Nested write: Creates records in the MealPlanRecipe table automatically
        recipes: {
          create:
            payload.recipes?.map((item) => ({
              recipeId: item.recipeId,
              day: item.day,
              mealType: item.mealType,
              servings: item.servings,
            })) || [],
        },
      },
      include: {
        recipes: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                nutrition: true,
              },
            },
          },
        },
      },
    });

    return mealPlan;
  });

  return result;
};

const getMyMealPlans = async (
  user: IRequestUser,
  query: Record<string, any>,
) => {
  const builder = new PrismaQueryBuilder({ ...query, userId: user.id })
    .filter(["page", "limit", "sortBy", "sortOrder"])
    .sort()
    .paginate()
    .include({
      recipes: {
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              nutrition: true,
              cookTime: true,
              prepTime: true,
            },
          },
        },
      },
      _count: { select: { recipes: true } },
    });

  console.log("Current User ID:", user.id);
  console.log("Prisma Query:", JSON.stringify(builder.build(), null, 2));
  const [mealPlans, total] = await Promise.all([
    prisma.mealPlan.findMany(builder.build()),
    prisma.mealPlan.count(builder.buildCount()),
  ]);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  return {
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    data: mealPlans,
  };
};

const getMealPlanById = async (id: string, user: IRequestUser) => {
  const mealPlan = await prisma.mealPlan.findUnique({
    where: { id },
    include: {
      recipes: {
        include: {
          recipe: true, // Pulls in the full recipe details for the frontend to render the meal view
        },
      },
    },
  });

  if (!mealPlan) {
    throw new AppError(status.NOT_FOUND, "Meal plan not found");
  }

  // Ensure users can only view their own meal plans
  if (mealPlan.userId !== user.id && user.role !== "ADMIN") {
    throw new AppError(status.FORBIDDEN, "Access denied");
  }

  return mealPlan;
};

const updateMealPlan = async (
  id: string,
  user: IRequestUser,
  payload: UpdateMealPlanInput,
) => {
  // 1. Verify existence and ownership
  const existingPlan = await prisma.mealPlan.findUnique({ where: { id } });

  if (!existingPlan) {
    throw new AppError(status.NOT_FOUND, "Meal plan not found");
  }

  if (existingPlan.userId !== user.id && user.role !== "ADMIN") {
    throw new AppError(status.FORBIDDEN, "Access denied");
  }

  // 2. Perform updates inside a transaction for safety
  const updatedPlan = await prisma.$transaction(async (tx) => {
    // Update the parent Meal Plan fields
    await tx.mealPlan.update({
      where: { id },
      data: {
        title: payload.title,
        description: payload.description,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
        totalCalorieGoal: payload.totalCalorieGoal,
        meals: payload.meals ? (payload.meals as any) : undefined,
      },
    });

    // 3. Handle Recipe Updates (The "Clear and Replace" Strategy)
    if (payload.recipes) {
      // First, remove all existing recipes for this specific meal plan
      await tx.mealPlanRecipe.deleteMany({
        where: { mealPlanId: id },
      });

      // Then, insert the new array of recipes (if any)
      if (payload.recipes.length > 0) {
        await tx.mealPlanRecipe.createMany({
          data: payload.recipes.map((item) => ({
            mealPlanId: id,
            recipeId: item.recipeId,
            day: item.day,
            mealType: item.mealType,
            servings: item.servings,
          })),
        });
      }
    }

    // 4. Return the freshly updated data with the new recipes attached
    return tx.mealPlan.findUnique({
      where: { id },
      include: {
        recipes: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
                nutrition: true,
              },
            },
          },
        },
      },
    });
  });

  return updatedPlan;
};

const deleteMealPlan = async (id: string, user: IRequestUser) => {
  const mealPlan = await prisma.mealPlan.findUnique({ where: { id } });

  if (!mealPlan) {
    throw new AppError(status.NOT_FOUND, "Meal plan not found");
  }

  if (mealPlan.userId !== user.id && user.role !== "ADMIN") {
    throw new AppError(status.FORBIDDEN, "Access denied");
  }

  // Because we set onDelete: Cascade in Prisma, this will automatically
  // delete all associated MealPlanRecipe records as well!
  await prisma.mealPlan.delete({ where: { id } });

  return null;
};

export const mealPlanService = {
  createMealPlan,
  getMyMealPlans,
  getMealPlanById,
  updateMealPlan,
  deleteMealPlan,
};
