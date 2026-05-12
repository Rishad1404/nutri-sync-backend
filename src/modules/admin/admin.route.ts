import { Router } from "express";
import { adminController } from "./admin.controller";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { Role } from "../../generated/prisma/enums";

const router = Router();
// STICKY RULE: Only ADMINS can enter this entire module
router.use(authorize(Role.ADMIN));

router.get("/users", adminController.getUsers);
router.get("/stats", adminController.getStats);
router.patch("/users/:id/status", adminController.changeUserStatus);
router.patch("/users/:id/role", adminController.changeUserRole);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.removeUser);
router.get("/analytics", adminController.getSystemAnalytics);

export const adminRoutes = router;
