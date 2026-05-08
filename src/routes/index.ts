import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.route";
import { recipeRoutes } from "../modules/recipe/recipe.route";
import { mediaRoutes } from "../modules/media/media.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/media", mediaRoutes);
router.use("/recipes", recipeRoutes);

export const apiRoutes = router;
