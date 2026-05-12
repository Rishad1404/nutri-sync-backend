import { Router } from "express";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { Role } from "../../generated/prisma/enums";
import { nutritionController } from "./nutrition.controller";

const router = Router();

router.use(authorize(Role.USER, Role.ADMIN));
router.post("/logs", nutritionController.logMeal);
router.get("/logs", nutritionController.getMyLogs);
router.get("/history", nutritionController.getHistory);
router.delete("/logs/:logId/meals/:mealId", nutritionController.removeMeal);

export const nutritionRoutes = router;
