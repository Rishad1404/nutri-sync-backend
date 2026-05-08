import { Role } from "@prisma/client";
import { Router } from "express";
import { authorize } from "../../shared/middlewares/authorize.middleware";
import { chatController } from "./chat.controller";
import { aiLimiter } from "../../config/rate-limit";

const router = Router();

router.use(aiLimiter);

// Protect all AI routes
router.use(authorize(Role.USER, Role.ADMIN));

router.post("/", chatController.sendMessage);
router.get("/history", chatController.getHistory);

export const chatRoutes = router;
