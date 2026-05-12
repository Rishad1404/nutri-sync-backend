import { Router } from "express";
import { ingredientController } from "./ingredient.controller";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { Role } from "../../generated/prisma/enums";

const router = Router();

// 1. Admin ONLY: Seed the database
router.post(
  "/seed",
  authorize(Role.ADMIN),
  ingredientController.seedIngredients,
);

// 2. User & Admin: Search the database
router.get(
  "/",
  authorize(Role.USER, Role.ADMIN),
  ingredientController.searchIngredients,
);

export const ingredientRoutes = router;
