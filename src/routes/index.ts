import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { recipeRoutes } from "../modules/recipe/recipe.route";
import { mediaRoutes } from "../modules/media/media.route";
import { mealPlanRoutes } from "../modules/meal-plan/meal-plan.route";
import { chatRoutes } from "../modules/chat/chat.route";
import { aiRoutes } from "../modules/ai/ai.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/media", mediaRoutes);
router.use("/recipes", recipeRoutes);
router.use("/meal-plans", mealPlanRoutes);
router.use("/chat", chatRoutes);
router.use("/ai", aiRoutes);

export const apiRoutes = router;
