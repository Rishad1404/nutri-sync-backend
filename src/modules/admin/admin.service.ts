import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../shared/errors/app-error";
import status from "http-status";

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

export const adminService = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteAnyRecipe,
  getPlatformStats,
};
