
import { GoogleGenAI } from "@google/genai";
import {
    incrementMetric,
    METRIC_NAMES
} from "./metricsService.js";

export const generateAnswer = async (question) => {
    try {
        // Check whether the API key is available
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing from environment variables");
        }

        // Initialize Gemini only when this function is called
        const ai = new GoogleGenAI({
            apiKey: apiKey
        });

        await incrementMetric(METRIC_NAMES.GEMINI_CALLS);
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: question
        });

        return response.text;

    } catch (error) {
        console.error("Gemini API Error:", error.message);
        throw error;
    }
};
const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

export const generateAnswerWithRetry = async (question) => {
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await generateAnswer(question);

        } catch (error) {
            const errorText = String(error.message || "");

            // Retry only temporary service failures
            const retryable =
                error.status === 503 ||
                error.code === 503 ||
                /"code"\s*:\s*503/.test(errorText) ||
                /UNAVAILABLE|high demand/i.test(errorText);

            if (!retryable || attempt === MAX_ATTEMPTS) {
                throw error;
            }

            const delay = 1000 * (2 ** (attempt - 1));

            console.warn(
                `Gemini unavailable. Attempt ${attempt}/${MAX_ATTEMPTS}. ` +
                `Retrying in ${delay}ms...`
            );

            await sleep(delay);
        }
    }
};
export const generateValidationResponse = async (prompt) => {
    return await generateAnswerWithRetry(prompt);
};