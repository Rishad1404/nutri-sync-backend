import { Router } from "express";
import { userController } from "./user.controller";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.use(authorize(Role.USER, Role.ADMIN));

router.get("/me", userController.getProfile);
router.get("/stats", userController.getMyStats);
router.patch("/profile", userController.updateMyProfile);
router.post("/profile", userController.updateMyProfile);
router.get("/analytics", userController.getMyAnalytics);
router.patch("/health-profile", userController.updateHealthProfile);

export const userRoutes = router;
