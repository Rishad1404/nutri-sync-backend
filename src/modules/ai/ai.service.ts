/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../../config";

const genAI = new GoogleGenerativeAI(config.geminiApiKey as string);

// Reusable model configuration that strictly enforces JSON output
const jsonModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

/**
 * FEATURE 2: AI Content Generator
 * Generates a fully structured recipe based on user input.
 */
const generateRecipeContent = async (prompt: string) => {
  const systemPrompt = `
    You are a master chef. The user will give you a prompt.
    Generate a recipe matching their request.
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
    User Prompt: ${prompt}
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
