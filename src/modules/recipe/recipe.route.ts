import { Role } from "@prisma/client";
import { Router } from "express";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { recipeController } from "./recipe.controller";

const router = Router();

// Public routes
router.get("/", recipeController.getAllRecipes);
router.get("/:id", recipeController.getRecipeById);

// Protected routes
router.post(
  "/",
  authorize(Role.ADMIN, Role.USER),
  recipeController.createRecipe,
);

router.patch(
  "/:id",
  authorize(Role.ADMIN, Role.USER),
  recipeController.updateRecipe,
);

router.delete(
  "/:id",
  authorize(Role.ADMIN, Role.USER),
  recipeController.deleteRecipe,
);

export const recipeRoutes = router;
