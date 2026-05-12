/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../../database/prisma";
import type { IRequestUser } from "../auth/auth.type";
import { ChatMessageInput } from "./chat.type";
import { config } from "../../config";

const genAI = new GoogleGenerativeAI(config.geminiApiKey as string);

const SYSTEM_INSTRUCTION = `
You are the NutriSync AI Assistant, a professional, empathetic, and highly knowledgeable expert in nutrition, meal planning, and culinary arts.

CORE RESPONSIBILITIES:
1. Provide accurate, science-based nutritional advice and meal planning tips.
2. Assist users with recipe modifications, ingredient substitutions, and cooking techniques.
3. If "Recipe Context" is provided, tailor your answer specifically to that recipe.

TONE & FORMATTING:
- Be encouraging, friendly, and concise. Do not write unnecessarily long paragraphs.
- Structure your responses beautifully using Markdown (bullet points, bold text for emphasis).
- NEVER use Markdown headers larger than H3 (###) to ensure it renders correctly in the app UI.

STRICT BOUNDARIES & SAFETY:
- You are NOT a doctor or a medical professional.
- NEVER diagnose illnesses, prescribe diets for specific medical conditions (e.g., diabetes, heart disease, eating disorders), or offer medical advice.
- If a user asks a health-critical question, politely decline and advise them to consult a qualified healthcare provider.
- Do not hallucinate or invent nutritional facts. If you are unsure, state that clearly.
`;

const processMessage = async (
  user: IRequestUser | undefined,
  payload: ChatMessageInput,
) => {
  // 1. Select the model and inject the professional system instruction
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  // 2. Build the prompt
  let promptText = payload.message;

  if (payload.recipeContext) {
    promptText = `Context: The user is currently viewing this recipe: ${JSON.stringify(payload.recipeContext)}\n\nUser Question: ${payload.message}`;
  }

  // 3. Call the Gemini API
  const result = await model.generateContent(promptText);
  const aiResponse = result.response.text();

  // 4. Save the interaction to the database ONLY for logged-in users
  let chatRecord = null;
  if (user?.id) {
    chatRecord = await prisma.chatHistory.create({
      data: {
        userId: user.id,
        message: payload.message,
        response: aiResponse,
        recipeContext: payload.recipeContext
          ? (payload.recipeContext as any)
          : undefined,
      },
    });
  } else {
    // For guests, return a simulated record
    chatRecord = {
      id: "guest-" + Date.now(),
      message: payload.message,
      response: aiResponse,
      recipeContext: payload.recipeContext,
      createdAt: new Date(),
    };
  }

  return chatRecord;
};

const getMyChatHistory = async (user: IRequestUser) => {
  if (!user?.id) {
    console.error("Attempted to fetch chat history without a valid user ID");
    return [];
  }

  // Fetch the user's past chats, newest first
  const history = await prisma.chatHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Reverse so the frontend gets them in chronological order (oldest to newest) for UI rendering
  return history.reverse();
};

const clearMyChatHistory = async (user: IRequestUser) => {
  return await prisma.chatHistory.deleteMany({
    where: { userId: user.id },
  });
};

export const chatService = {
  processMessage,
  getMyChatHistory,
  clearMyChatHistory,
};
