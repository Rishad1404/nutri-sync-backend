import { Router } from "express";
import { aiController } from "./ai.controller";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { Role } from "../../generated/prisma";
import { aiLimiter } from "../../config/rate-limit";

const router = Router();

router.use(aiLimiter);

// Public route for guest users (with strict rate limit)
router.post("/public-analyze-nutrition", aiController.analyzeNutrition);

// Protect these routes so random bots can't drain your Gemini quota
router.use(authorize(Role.USER, Role.ADMIN));

router.post("/generate-recipe", aiController.generateRecipe);
router.post("/auto-tag", aiController.generateTags);
router.post("/analyze-nutrition", aiController.analyzeNutrition);

export const aiRoutes = router;
