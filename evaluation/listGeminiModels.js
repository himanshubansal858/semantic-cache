import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

try {
    const models = await ai.models.list();

    for await (const model of models) {
        if (
            model.name?.startsWith("models/gemini") &&
            model.supportedActions?.includes("generateContent")
        ) {
            console.log(model.name);
        }
    }
} catch (error) {
    console.error("Failed to list models:", error.message);
    process.exitCode = 1;
}