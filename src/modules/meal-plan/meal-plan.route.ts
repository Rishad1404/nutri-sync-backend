import { Role } from "../../generated/prisma/enums";
import { Router } from "express";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { mealPlanController } from "./meal-plan.controller";

const router = Router();

// All meal plan routes require the user to be logged in
router.use(authorize(Role.USER, Role.ADMIN));

router.post("/", mealPlanController.createMealPlan);
router.get("/", mealPlanController.getMyMealPlans);
router.get("/:id", mealPlanController.getMealPlanById);
router.patch("/:id", mealPlanController.updateMealPlan);
router.delete("/:id", mealPlanController.deleteMealPlan);

export const mealPlanRoutes = router;
