import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/utils/catch-async";
import { sendResponse } from "../../shared/utils/send-response";
import { ingredientService } from "./ingredient.service";

const seedIngredients = catchAsync(async (req: Request, res: Response) => {
  const result = await ingredientService.seedIngredients(req.body.ingredients);

  sendResponse(res, {
    status: status.CREATED,
    success: true,
    message: `Successfully seeded ${result.count} ingredients`,
    data: result,
  });
});

const searchIngredients = catchAsync(async (req: Request, res: Response) => {
  const searchTerm = req.query.search as string;
  const result = await ingredientService.searchIngredients(searchTerm);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Ingredients retrieved successfully",
    data: result,
  });
});

export const ingredientController = {
  seedIngredients,
  searchIngredients,
};
