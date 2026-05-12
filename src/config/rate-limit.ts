import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Increased slightly for registered users
  message: {
    success: false,
    message: "AI quota reached for this hour. Try again soon!",
  },
});

export const guestAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Strict limit for guests
  message: {
    success: false,
    message: "Guest AI quota reached. Sign in for more chats!",
  },
});

export const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please wait 30 minutes.",
  },
});
