/**
 * Google Gemini AI Client
 * Singleton client for the Google Generative AI SDK.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import logger from '../utils/logger';

let geminiClient: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

/**
 * Initialize the Gemini client. Called once at app startup.
 */
export const initGemini = (): void => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not set — AI analysis will fail');
    return;
  }

  geminiClient = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  geminiModel = geminiClient.getGenerativeModel({ model: modelName });

  logger.info('Gemini AI client initialized', { model: modelName });
};

/**
 * Get the initialized Gemini model.
 * Throws if the client has not been initialized or API key is missing.
 */
export const getGeminiModel = (): GenerativeModel => {
  if (!geminiModel) {
    throw new Error(
      'Gemini client is not initialized. Check that GEMINI_API_KEY is set.'
    );
  }
  return geminiModel;
};

/**
 * Generate content using the Gemini model.
 * Returns the raw text response.
 */
export const generateContent = async (prompt: string): Promise<{ text: string; usage?: { promptTokens?: number; completionTokens?: number } }> => {
  const model = getGeminiModel();

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return {
    text,
    usage: {
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount,
    },
  };
};
