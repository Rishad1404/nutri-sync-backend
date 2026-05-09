/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../database/prisma";

/**
 * Admin: Bulk insert ingredients into the database.
 * Uses `skipDuplicates` so you can run it multiple times safely.
 */
const seedIngredients = async (payload: any[]) => {
  const result = await prisma.ingredient.createMany({
    data: payload.map((item) => ({
      name: item.name.toLowerCase(),
      caloriesPerUnit: item.caloriesPerUnit,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
      unit: item.unit || "grams",
    })),
    skipDuplicates: true,
  });

  return result;
};

/**
 * User/AI: Search for ingredients by name to calculate macros
 */
const searchIngredients = async (searchTerm?: string) => {
  return await prisma.ingredient.findMany({
    where: searchTerm
      ? { name: { contains: searchTerm.toLowerCase(), mode: "insensitive" } }
      : undefined,
    take: 50,
  });
};

export const ingredientService = {
  seedIngredients,
  searchIngredients,
};
