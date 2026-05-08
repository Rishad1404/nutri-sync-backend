import { z } from "zod";

export const chatMessageSchema = z.object({
  body: z.object({
    message: z
      .string()
      .min(1, "Message cannot be empty")
      .max(1000, "Message is too long"),
    // Optional: If the user is chatting while looking at a specific recipe,
    // the frontend can pass that recipe's data here for the AI to understand the context.
    recipeContext: z.any().optional(),
  }),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>["body"];
