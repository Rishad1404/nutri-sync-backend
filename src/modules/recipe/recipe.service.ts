/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserStatus } from "@prisma/client";
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
import cache from "../../shared/utils/cache";

/**
 * Helper to check if a user is blocked
 */
const validateUserStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });

  if (!user || user.status === UserStatus.BLOCKED) {
    throw new AppError(
      status.FORBIDDEN,
      "Your account is blocked. You can only view recipes.",
    );
  }
};

/**
 * @description Create a new recipe
 */
const createRecipe = async (user: IRequestUser, payload: CreateRecipeInput) => {
  // 1. Check if user is blocked before allowing post
  await validateUserStatus(user.id);

  const recipe = await prisma.recipe.create({
    data: {
      ...payload,
      ingredients: payload.ingredients as any,
      steps: payload.steps as any,
      nutrition: payload.nutrition as any,
      createdById: user.id,
    },
  });

  // Clear cache for list views
  const keys = cache.keys();
  const recipeKeys = keys.filter((key) => key.startsWith("recipes:"));
  cache.del(recipeKeys);

  return recipe;
};

/**
 * @description Get all recipes (Viewing is allowed for blocked users)
 */
const getAllRecipes = async (query: RecipeFilters) => {
  const cacheKey = `recipes:${JSON.stringify(query)}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

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

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany(builder.build()),
    prisma.recipe.count(builder.buildCount()),
  ]);

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const totalPages = Math.ceil(total / limit);

  const result = {
    meta: { total, page, limit, totalPages },
    data: recipes,
  };

  cache.set(cacheKey, result);
  return result;
};

/**
 * @description Get a single recipe (Viewing is allowed for blocked users)
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

  if (!recipe) throw new AppError(status.NOT_FOUND, "Recipe not found");

  prisma.recipe
    .update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  return recipe;
};

/**
 * @description Update a recipe (Creator or Admin only + Blocked check)
 */
const updateRecipe = async (
  id: string,
  user: IRequestUser,
  payload: UpdateRecipeInput,
) => {
  // 1. Check if user is blocked
  await validateUserStatus(user.id);

  const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
  if (!existingRecipe) throw new AppError(status.NOT_FOUND, "Recipe not found");

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
 * @description Delete a recipe (Creator or Admin only + Blocked check)
 */
const deleteRecipe = async (id: string, user: IRequestUser) => {
  // 1. Check if user is blocked
  await validateUserStatus(user.id);

  const existingRecipe = await prisma.recipe.findUnique({ where: { id } });
  if (!existingRecipe) throw new AppError(status.NOT_FOUND, "Recipe not found");

  if (existingRecipe.createdById !== user.id && user.role !== "ADMIN") {
    throw new AppError(
      status.FORBIDDEN,
      "You do not have permission to delete this recipe",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.recipe.delete({ where: { id } });
    if (user.role === "ADMIN" && existingRecipe.createdById !== user.id) {
      await tx.adminLog.create({
        data: {
          adminId: user.id,
          action: "DELETE_RECIPE",
          targetId: id,
          details: { recipeTitle: existingRecipe.title },
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
