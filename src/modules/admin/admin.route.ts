import { Router } from "express";
import { adminController } from "./admin.controller";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { Role } from "@prisma/client";

const router = Router();

// STICKY RULE: Only ADMINS can enter this entire module
router.use(authorize(Role.ADMIN));

router.get("/users", adminController.getUsers);
router.get("/stats", adminController.getStats);
router.patch("/users/:id/status", adminController.changeUserStatus);
router.patch("/users/:id/role", adminController.changeUserRole);

export const adminRoutes = router;
