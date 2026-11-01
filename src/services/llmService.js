
import { GoogleGenAI } from "@google/genai";

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
