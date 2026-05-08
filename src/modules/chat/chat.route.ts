import { Role } from "@prisma/client";
import { Router } from "express";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { chatController } from "./chat.controller";

const router = Router();

// Protect all AI routes
router.use(authorize(Role.USER, Role.ADMIN));

router.post("/", chatController.sendMessage);
router.get("/history", chatController.getHistory);

export const chatRoutes = router;
