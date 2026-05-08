import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import { mealPlanService } from "./meal-plan.service";
import { createMealPlanSchema, updateMealPlanSchema } from "./meal-plan.type";
import type { IRequestUser } from "../auth/auth.type";

const createMealPlan = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const payload = createMealPlanSchema.shape.body.parse(req.body);

  const result = await mealPlanService.createMealPlan(user, payload);

  sendResponse(res, {
    status: status.CREATED,
    success: true,
    message: "Meal plan created successfully",
    data: result,
  });
});

const getMyMealPlans = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const result = await mealPlanService.getMyMealPlans(user, req.query);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Meal plans fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMealPlanById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;

  const result = await mealPlanService.getMealPlanById(id as string, user);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Meal plan fetched successfully",
    data: result,
  });
});

const updateMealPlan = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;
  const payload = updateMealPlanSchema.shape.body.parse(req.body);

  const result = await mealPlanService.updateMealPlan(
    id as string,
    user,
    payload,
  );

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Meal plan updated successfully",
    data: result,
  });
});

const deleteMealPlan = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const { id } = req.params;

  await mealPlanService.deleteMealPlan(id as string, user);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Meal plan deleted successfully",
    data: null,
  });
});

export const mealPlanController = {
  createMealPlan,
  getMyMealPlans,
  getMealPlanById,
  updateMealPlan,
  deleteMealPlan,
};
