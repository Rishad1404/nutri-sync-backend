import { Router } from "express";
import { aiController } from "./ai.controller";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Protect these routes so random bots can't drain your Gemini quota
router.use(authorize(Role.USER, Role.ADMIN));

router.post("/generate-recipe", aiController.generateRecipe);
router.post("/auto-tag", aiController.generateTags);
router.post("/analyze-nutrition", aiController.analyzeNutrition);

export const aiRoutes = router;
