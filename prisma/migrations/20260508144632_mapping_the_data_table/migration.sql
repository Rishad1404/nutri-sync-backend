/*
  Warnings:

  - You are about to drop the `admin-logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `chat-history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meal-plan-recipes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meal-plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user-nutrition-logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chat-history" DROP CONSTRAINT "chat-history_userId_fkey";

-- DropForeignKey
ALTER TABLE "meal-plan-recipes" DROP CONSTRAINT "meal-plan-recipes_mealPlanId_fkey";

-- DropForeignKey
ALTER TABLE "meal-plan-recipes" DROP CONSTRAINT "meal-plan-recipes_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "meal-plans" DROP CONSTRAINT "meal-plans_userId_fkey";

-- DropForeignKey
ALTER TABLE "user-nutrition-logs" DROP CONSTRAINT "user-nutrition-logs_userId_fkey";

-- DropTable
DROP TABLE "admin-logs";

-- DropTable
DROP TABLE "chat-history";

-- DropTable
DROP TABLE "meal-plan-recipes";

-- DropTable
DROP TABLE "meal-plans";

-- DropTable
DROP TABLE "user-nutrition-logs";

-- CreateTable
CREATE TABLE "userNutritionLogs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL,
    "totalProtein" DOUBLE PRECISION NOT NULL,
    "totalCarbs" DOUBLE PRECISION NOT NULL,
    "totalFat" DOUBLE PRECISION NOT NULL,
    "totalFiber" DOUBLE PRECISION,
    "meals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userNutritionLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adminLogs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adminLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mealPlans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalCalorieGoal" INTEGER NOT NULL,
    "meals" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mealPlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mealPlanRecipes" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "servings" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "day" INTEGER NOT NULL,
    "mealType" TEXT NOT NULL,

    CONSTRAINT "mealPlanRecipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "recipeContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_nutrition_log_userId" ON "userNutritionLogs"("userId");

-- CreateIndex
CREATE INDEX "idx_user_nutrition_log_date" ON "userNutritionLogs"("date");

-- CreateIndex
CREATE UNIQUE INDEX "userNutritionLogs_userId_date_key" ON "userNutritionLogs"("userId", "date");

-- CreateIndex
CREATE INDEX "idx_admin_log_adminId" ON "adminLogs"("adminId");

-- CreateIndex
CREATE INDEX "idx_admin_log_action" ON "adminLogs"("action");

-- CreateIndex
CREATE INDEX "idx_meal_plan_userId" ON "mealPlans"("userId");

-- CreateIndex
CREATE INDEX "idx_meal_plan_status" ON "mealPlans"("status");

-- CreateIndex
CREATE INDEX "idx_meal_plan_recipe_meal_planId" ON "mealPlanRecipes"("mealPlanId");

-- CreateIndex
CREATE INDEX "idx_meal_plan_recipe_recipeId" ON "mealPlanRecipes"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "mealPlanRecipes_mealPlanId_recipeId_day_mealType_key" ON "mealPlanRecipes"("mealPlanId", "recipeId", "day", "mealType");

-- CreateIndex
CREATE INDEX "idx_chat_history_userId" ON "chatHistory"("userId");

-- CreateIndex
CREATE INDEX "idx_chat_history_createdAt" ON "chatHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "userNutritionLogs" ADD CONSTRAINT "userNutritionLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mealPlans" ADD CONSTRAINT "mealPlans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mealPlanRecipes" ADD CONSTRAINT "mealPlanRecipes_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "mealPlans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mealPlanRecipes" ADD CONSTRAINT "mealPlanRecipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatHistory" ADD CONSTRAINT "chatHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
