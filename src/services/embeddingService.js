import { GoogleGenAI } from "@google/genai";
import { generateLocalEmbedding } from "./localEmbeddingService.js";

export const generateEmbedding = async (text) => {
    try {
        if (!text || !text.trim()) {
            throw new Error("Text is required to generate an embedding");
        }
        if (process.env.EMBEDDING_PROVIDER === "local") {
            return await generateLocalEmbedding(text);
        }
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing");
        }

        const ai = new GoogleGenAI({
            apiKey: apiKey
        });

        const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: text,
            config: {
                taskType: "SEMANTIC_SIMILARITY",
                outputDimensionality: 768
            }
        });

        const embedding = response.embeddings[0].values;

        return embedding;

    } catch (error) {
        console.error("Embedding Generation Error:", error.message);
        throw error;
    }
};
