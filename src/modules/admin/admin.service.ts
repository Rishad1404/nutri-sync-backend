/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";
import status from "http-status";
import { ChartBuilder } from "../../shared/utils/chart-builder";
import { Role, UserStatus } from "@prisma/client";

// --- User Management ---
const getAllUsers = async () => {
  return await prisma.user.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      status: status,
    },
  });
};

const updateUserRole = async (userId: string, newRole: Role) => {
  // 1. Verify user existence
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 2. Perform the update
  return await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });
};

const updateUser = async (userId: string, data: any) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      calorieTarget: data.calorieTarget,
    },
  });
};

// --- Content Moderation ---
const deleteAnyRecipe = async (recipeId: string) => {
  return await prisma.recipe.delete({
    where: { id: recipeId },
  });
};

// --- Platform Analytics (Basic) ---
const getPlatformStats = async () => {
  const [userCount, recipeCount, mealPlanCount] = await Promise.all([
    prisma.user.count(),
    prisma.recipe.count(),
    prisma.mealPlan.count(),
  ]);

  return {
    users: userCount,
    recipes: recipeCount,
    mealPlans: mealPlanCount,
  };
};

const deleteUser = async (userId: string) => {
  // 1. Verify user exists and isn't already deleted
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  // 2. Perform Soft Delete using your schema fields
  return await prisma.user.update({
    where: { id: userId },
    data: {
      status: UserStatus.DELETED,
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

const getAdminAnalytics = async () => {
  const [users, recipes, logs] = await Promise.all([
    prisma.user.findMany({ select: { createdAt: true } }),
    prisma.recipe.findMany({ select: { cuisine: true } }),
    prisma.userNutritionLog.findMany({ select: { createdAt: true } }),
  ]);

  const userGrowth = ChartBuilder.countByDate(users, "createdAt", "monthly");
  const cuisineDistribution = ChartBuilder.getDistribution(recipes, "cuisine");
  const systemEngagement = ChartBuilder.countByDate(logs, "createdAt", "daily");

  return { userGrowth, cuisineDistribution, systemEngagement };
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteAnyRecipe,
  getPlatformStats,
  deleteUser,
  getAdminAnalytics,
  updateUser,
};
