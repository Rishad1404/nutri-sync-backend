/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";
import { PrismaQueryBuilder } from "../../shared/utils/query-builder";
import type { IRequestUser } from "../auth/auth.type";
import type {
  CreateRecipeInput,
  RecipeFilters,
  UpdateRecipeInput,
} from "./recipe.type";

/**
 * @description Create a new recipe
 */
const createRecipe = async (user: IRequestUser, payload: CreateRecipeInput) => {
  const recipe = await prisma.recipe.create({
    data: {
      ...payload,
      // Prisma handles converting JS arrays/objects to JSON for these fields
      ingredients: payload.ingredients as any,
      steps: payload.steps as any,
      nutrition: payload.nutrition as any,
      createdById: user.id,
    },
  });

  return recipe;
};

/**
 * @description Get all recipes with search, filter, sort, and pagination
 */
const getAllRecipes = async (query: RecipeFilters) => {
  const builder = new PrismaQueryBuilder(query)
    .search(["title", "description", "cuisine"])
    .filter(["search", "page", "limit", "sortBy", "sortOrder"])
    .sort()
    .paginate()
    .include({
      createdBy: {
        select: { id: true, name: true, image: true },
      },
    });

  // 2. Fetch data and total count concurrently for performance
  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany(builder.build()),
    prisma.recipe.count(builder.buildCount()),
  ]);

  // 3. Calculate pagination metadata
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
    data: recipes,
  };
};

/**
 * @description Get a single recipe by ID
 */
const getRecipeById = async (id: string) => {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { favorites: true, mealPlanRecipes: true },
      },
    },
  });

  if (!recipe) {
    throw new AppError(status.NOT_FOUND, "Recipe not found");
  }

  // Increment view count in the background (no await needed for fast response)
  prisma.recipe
    .update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  return recipe;
};

/**
 * @description Update a recipe (Creator or Admin only)
 */
const updateRecipe = async (
  id: string,
  user: IRequestUser,
  payload: UpdateRecipeInput,
) => {
  const existingRecipe = await prisma.recipe.findUnique({
    where: { id },
  });

  if (!existingRecipe) {
    throw new AppError(status.NOT_FOUND, "Recipe not found");
  }

  // Authorization Check
  if (existingRecipe.createdById !== user.id && user.role !== "ADMIN") {
    throw new AppError(
      status.FORBIDDEN,
      "You do not have permission to update this recipe",
    );
  }

  const updatedRecipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...payload,
      ingredients: payload.ingredients
        ? (payload.ingredients as any)
        : undefined,
      steps: payload.steps ? (payload.steps as any) : undefined,
      nutrition: payload.nutrition ? (payload.nutrition as any) : undefined,
    },
  });

  return updatedRecipe;
};

/**
 * @description Delete a recipe (Creator or Admin only)
 */
const deleteRecipe = async (id: string, user: IRequestUser) => {
  const existingRecipe = await prisma.recipe.findUnique({
    where: { id },
  });

  if (!existingRecipe) {
    throw new AppError(status.NOT_FOUND, "Recipe not found");
  }

  // Authorization Check
  if (existingRecipe.createdById !== user.id && user.role !== "ADMIN") {
    throw new AppError(
      status.FORBIDDEN,
      "You do not have permission to delete this recipe",
    );
  }

  // Transaction: If an Admin deletes someone else's recipe, log it!
  await prisma.$transaction(async (tx) => {
    await tx.recipe.delete({ where: { id } });

    if (user.role === "ADMIN" && existingRecipe.createdById !== user.id) {
      await tx.adminLog.create({
        data: {
          adminId: user.id,
          action: "DELETE_RECIPE",
          targetId: id,
          details: {
            reason: "Moderation removal",
            recipeTitle: existingRecipe.title,
          },
        },
      });
    }
  });

  return null;
};

export const recipeService = {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
};
