/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import status from "http-status";
import { nutritionService } from "./nutrition.service";

const logMeal = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await nutritionService.logNutrition(userId, req.body);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Nutrition logged successfully",
    data: result,
  });
});

const getMyLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { date } = req.query;
  const result = await nutritionService.getDailyLogs(userId, date as string);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Nutrition logs retrieved successfully",
    data: result,
  });
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { days } = req.query;
  const result = await nutritionService.getNutritionHistory(userId, days ? Number(days) : 30);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Nutrition history retrieved successfully",
    data: result,
  });
});

const removeMeal = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { logId, mealId } = req.params;
  const result = await nutritionService.deleteMealEntry(
    userId,
    logId as string,
    mealId as string,
  );

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Meal entry removed successfully",
    data: result,
  });
});

export const nutritionController = {
  logMeal,
  getMyLogs,
  getHistory,
  removeMeal,
};
