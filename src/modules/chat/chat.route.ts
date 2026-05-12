import { Role } from "@prisma/client";
import { Router } from "express";
import { authorize, optionalAuthenticate } from "../../shared/middlewares/authorize.middleware";
import { chatController } from "./chat.controller";
import { aiLimiter, guestAiLimiter } from "../../config/rate-limit";

const router = Router();

// Message route: Public with strict rate limit for guests, higher limit for users
router.post(
  "/",
  optionalAuthenticate,
  (req, res, next) => {
    // Apply appropriate rate limit based on auth status
    if (req.user) {
      return aiLimiter(req, res, next);
    }
    return guestAiLimiter(req, res, next);
  },
  chatController.sendMessage
);

// History route: Strictly for logged-in users
router.get(
  "/history",
  authorize(Role.USER, Role.ADMIN),
  chatController.getHistory
);

router.delete(
  "/history",
  authorize(Role.USER, Role.ADMIN),
  chatController.clearHistory
);

export const chatRoutes = router;
