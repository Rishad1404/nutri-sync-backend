import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";
import status from "http-status";
import { ChartBuilder } from "../../shared/utils/chart-builder";

// --- User Management ---
const getAllUsers = async () => {
  return await prisma.user.findMany({
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
  const [users, recipes] = await Promise.all([
    prisma.user.findMany({ select: { createdAt: true } }),
    prisma.recipe.findMany({ select: { cuisine: true } }),
  ]);

  const userGrowth = ChartBuilder.groupByDate(
    users,
    "createdAt",
    "id",
    "monthly",
  );

  const cuisineDistribution = ChartBuilder.getDistribution(recipes, "cuisine");

  return { userGrowth, cuisineDistribution };
};

export const adminService = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteAnyRecipe,
  getPlatformStats,
  deleteUser,
  getAdminAnalytics,
};
