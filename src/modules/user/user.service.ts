/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";
import status from "http-status";
import { ChartBuilder } from "../../shared/utils/chart-builder";

const getUserStats = async (userId: string) => {
  const [recipeCount, favoriteCount, mealPlanCount, logCount] =
    await Promise.all([
      prisma.recipe.count({ where: { createdById: userId } }),
      prisma.favorite.count({ where: { userId } }),
      prisma.mealPlan.count({ where: { userId } }),
      prisma.userNutritionLog.count({ where: { userId } }),
    ]);

  // Get recent activity for the dashboard UI
  const recentLogs = await prisma.userNutritionLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    counts: {
      recipes: recipeCount,
      favorites: favoriteCount,
      mealPlans: mealPlanCount,
      logs: logCount,
    },
    recentLogs,
  };
};

const updateProfile = async (userId: string, payload: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  // We filter the payload to ensure only specific fields are updated
  return await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
      image: payload.image,
      dietaryPreferences: payload.dietaryPreferences,
      allergies: payload.allergies,
      goals: payload.goals,
      calorieTarget: payload.calorieTarget,
    },
  });
};

const getMe = async (userId: string) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      nutritionLog: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
};

const getUserAnalytics = async (userId: string) => {
  const logs = await prisma.userNutritionLog.findMany({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  const calorieTrend = ChartBuilder.groupByDate(
    logs,
    "createdAt",
    "totalCalories",
    "daily",
  );

  const macroBreakdown = [
    {
      name: "Protein",
      value: logs.reduce((sum: number, l: any) => (sum += l.totalProtein), 0),
    },
    {
      name: "Carbs",
      value: logs.reduce((sum: number, l: any) => (sum += l.totalCarbs), 0),
    },
    {
      name: "Fat",
      value: logs.reduce((sum: number, l: any) => (sum += l.totalFat), 0),
    },
  ];

  return { calorieTrend, macroBreakdown };
};

export const userService = {
  getUserStats,
  updateProfile,
  getMe,
  getUserAnalytics,
};
