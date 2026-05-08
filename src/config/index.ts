import dotenv from "dotenv";
import path from "path";

// Load the environment variables from the .env file
dotenv.config({ path: path.join(process.cwd(), ".env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,

  // This is the variable the chat service is looking for!
  geminiApiKey: process.env.GEMINI_API_KEY,
};
