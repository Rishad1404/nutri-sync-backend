/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../../config";
import { prisma } from "../../database/prisma";

const genAI = new GoogleGenerativeAI(config.geminiApiKey as string);

// Reusable model configuration that strictly enforces JSON output
const jsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

const generateRecipeContent = async (prompt: string, userId: string) => {
  // 1. Fetch user health data from the DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      dietaryPreferences: true,
      allergies: true,
      goals: true,
    },
  });

  // 2. Inject health constraints into the System Prompt
  const systemPrompt = `
    You are a master chef and nutritionist. 
    User Constraints:
    - Dietary Preferences: ${user?.dietaryPreferences?.join(", ") || "None"}
    - Allergies: ${user?.allergies?.join(", ") || "None"}
    - Current Goal: ${user?.goals || "General Health"}

    Generate a recipe matching the user prompt: "${prompt}".
    
    CRITICAL SAFETY RULES:
    1. If the user has allergies, you MUST NOT include those ingredients.
    2. Respect the dietary preferences (e.g., if Vegan, do not use meat/dairy).
    
    You MUST return ONLY a JSON object with this exact structure:
    {
      "title": "String",
      "description": "String",
      "cookTime": Number,
      "prepTime": Number,
      "servings": Number,
      "difficulty": "easy | medium | hard",
      "cuisine": "String",
      "ingredients": [{ "name": "String", "quantity": Number, "unit": "String" }],
      "steps": [{ "stepNumber": Number, "instruction": "String" }]
    }
  `;

  const result = await jsonModel.generateContent(systemPrompt);
  return JSON.parse(result.response.text());
};

/**
 * FEATURE 3: AI Auto-Tagging (Classification)
 * Analyzes ingredients/title and returns categorical tags.
 */
const autoTagRecipe = async (title: string, ingredients: any[]) => {
  const systemPrompt = `
    Analyze the following recipe title and ingredients.
    Return an array of exactly 5 relevant dietary and categorical tags (e.g., "Vegan", "High Protein", "Gluten-Free", "Quick Meal").
    You MUST return ONLY a JSON array of strings: ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"]
    
    Title: ${title}
    Ingredients: ${JSON.stringify(ingredients)}
  `;

  const result = await jsonModel.generateContent(systemPrompt);
  return JSON.parse(result.response.text());
};

/**
 * FEATURE 4: AI Nutritional Data Analyzer
 * Takes messy natural language food descriptions and extracts exact macros.
 */
const analyzeNutritionData = async (rawFoodText: string) => {
  const systemPrompt = `
    You are a nutritionist AI. Analyze the following meal description and estimate the total nutritional values.
    You MUST return ONLY a JSON object with this exact structure:
    {
      "calories": Number,
      "protein": Number,
      "carbs": Number,
      "fat": Number,
      "fiber": Number,
      "analysisSummary": "A short 1-sentence summary of the meal's health impact."
    }
    
    Meal Description: ${rawFoodText}
  `;

  const result = await jsonModel.generateContent(systemPrompt);
  return JSON.parse(result.response.text());
};

export const aiService = {
  generateRecipeContent,
  autoTagRecipe,
  analyzeNutritionData,
};
