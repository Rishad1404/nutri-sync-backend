import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import { recipeService } from "./recipe.service";
import {
  createRecipeSchema,
  recipeQuerySchema,
  updateRecipeSchema,
} from "./recipe.type";
import type { IRequestUser } from "../auth/auth.type";

// create recipe
const createRecipe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const payload = createRecipeSchema.shape.body.parse(req.body);
  const result = await recipeService.createRecipe(user, payload);

  sendResponse(res, {
    status: status.CREATED,
    success: true,
    message: "Recipe created successfully",
    data: result,
  });
});

// get all recipes
const getAllRecipes = catchAsync(async (req: Request, res: Response) => {
  const query = recipeQuerySchema.shape.query.parse(req.query);
  const result = await recipeService.getAllRecipes(query);
  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Recipes fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await recipeService.toggleFavorite(userId, id as string);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: result.favorited
      ? "Recipe added to favorites"
      : "Recipe removed from favorites",
    data: result,
  });
});

// get single recipe by ID
const getRecipeById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await recipeService.getRecipeById(id as string);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Recipe fetched successfully",
    data: result,
  });
});

// update recipe
const updateRecipe = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user as IRequestUser;

  const payload = updateRecipeSchema.shape.body.parse(req.body);

  const result = await recipeService.updateRecipe(id as string, user, payload);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Recipe updated successfully",
    data: result,
  });
});

const deleteRecipe = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user as IRequestUser;
  await recipeService.deleteRecipe(id as string, user);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Recipe deleted successfully",
    data: null,
  });
});

export const recipeController = {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
};
