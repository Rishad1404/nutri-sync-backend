import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import { aiService } from "./ai.service";

const generateRecipe = catchAsync(async (req: Request, res: Response) => {
  const { prompt } = req.body;
  const result = await aiService.generateRecipeContent(prompt);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Recipe generated successfully",
    data: result,
  });
});

const generateTags = catchAsync(async (req: Request, res: Response) => {
  const { title, ingredients } = req.body;
  const result = await aiService.autoTagRecipe(title, ingredients);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Tags generated successfully",
    data: result,
  });
});

const analyzeNutrition = catchAsync(async (req: Request, res: Response) => {
  const { rawFoodText } = req.body;
  const result = await aiService.analyzeNutritionData(rawFoodText);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Nutrition analyzed successfully",
    data: result,
  });
});

export const aiController = {
  generateRecipe,
  generateTags,
  analyzeNutrition,
};
