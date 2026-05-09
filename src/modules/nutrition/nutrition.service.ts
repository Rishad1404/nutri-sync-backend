/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";
import status from "http-status";
import crypto from "crypto";

const logNutrition = async (userId: string, payload: any) => {
  try {
    const { foodName, calories, protein, carbs, fat, mealType, date } = payload;

    if (!foodName || calories === undefined) {
      throw new AppError(status.BAD_REQUEST, "Missing required nutrition data");
    }

    // Set time to midnight UTC for unique date matching
    const logDate = date ? new Date(date) : new Date();
    logDate.setUTCHours(0, 0, 0, 0);

    console.log(`[NutritionService] Logging for user ${userId} on ${logDate.toISOString()}`);

    const existingLog = await prisma.userNutritionLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    const mealEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      foodName,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      mealType: mealType || "Snack",
      time: new Date().toISOString(),
    };

    if (existingLog) {
      console.log(`[NutritionService] Updating existing log ${existingLog.id}`);
      const currentMeals = Array.isArray(existingLog.meals) ? existingLog.meals : [];
      return await prisma.userNutritionLog.update({
        where: { id: existingLog.id },
        data: {
          totalCalories: (existingLog.totalCalories || 0) + mealEntry.calories,
          totalProtein: (existingLog.totalProtein || 0) + mealEntry.protein,
          totalCarbs: (existingLog.totalCarbs || 0) + mealEntry.carbs,
          totalFat: (existingLog.totalFat || 0) + mealEntry.fat,
          meals: [...currentMeals, mealEntry],
        },
      });
    } else {
      console.log(`[NutritionService] Creating new log`);
      return await prisma.userNutritionLog.create({
        data: {
          userId,
          date: logDate,
          totalCalories: mealEntry.calories,
          totalProtein: mealEntry.protein,
          totalCarbs: mealEntry.carbs,
          totalFat: mealEntry.fat,
          meals: [mealEntry],
        },
      });
    }
  } catch (error) {
    console.error("[NutritionService] Fatal error in logNutrition:", error);
    throw error;
  }
};

const getDailyLogs = async (userId: string, date?: string) => {
  try {
    const logDate = date ? new Date(date) : new Date();
    logDate.setUTCHours(0, 0, 0, 0);

    console.log(`[NutritionService] Fetching logs for user ${userId} on ${logDate.toISOString()}`);

    const log = await prisma.userNutritionLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: logDate,
        },
      },
    });

    return log;
  } catch (error) {
    console.error("[NutritionService] Error in getDailyLogs:", error);
    throw error;
  }
};

const getNutritionHistory = async (userId: string, days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setUTCHours(0, 0, 0, 0);

    return await prisma.userNutritionLog.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });
  } catch (error) {
    console.error("[NutritionService] Error in getNutritionHistory:", error);
    throw error;
  }
};

const deleteMealEntry = async (userId: string, logId: string, mealId: string) => {
  try {
    const log = await prisma.userNutritionLog.findUnique({
      where: { id: logId, userId },
    });

    if (!log) throw new AppError(status.NOT_FOUND, "Log not found");

    const meals = (log.meals as any[]) || [];
    const mealToDelete = meals.find((m) => m.id === mealId);

    if (!mealToDelete) throw new AppError(status.NOT_FOUND, "Meal entry not found");

    const updatedMeals = meals.filter((m) => m.id !== mealId);

    return await prisma.userNutritionLog.update({
      where: { id: logId },
      data: {
        totalCalories: Math.max(0, (log.totalCalories || 0) - mealToDelete.calories),
        totalProtein: Math.max(0, (log.totalProtein || 0) - mealToDelete.protein),
        totalCarbs: Math.max(0, (log.totalCarbs || 0) - mealToDelete.carbs),
        totalFat: Math.max(0, (log.totalFat || 0) - mealToDelete.fat),
        meals: updatedMeals,
      },
    });
  } catch (error) {
    console.error("[NutritionService] Error in deleteMealEntry:", error);
    throw error;
  }
};

export const nutritionService = {
  logNutrition,
  getDailyLogs,
  getNutritionHistory,
  deleteMealEntry,
};
