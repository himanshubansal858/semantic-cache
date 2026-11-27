
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const model = process.env.TEST_GEMINI_MODEL || "gemini-3.5-flash-lite";
console.log("Testing Gemini model:", model);

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

async function testConnection() {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxAttempts}`);

            const response = await ai.models.generateContent({
                model,
                contents: "Reply with exactly: OK",
                config: {
                    temperature: 0,
                    maxOutputTokens: 100
                }
            });

            console.log("Model:", model);
            console.log("Response:", response.text);
            return;

        } catch (error) {
            console.error(
                `Attempt ${attempt} failed:`,
                error.message
            );

            const status =
                error.status ??
                error.code ??
                Number(error.message?.match(/"code":\s*(\d+)/)?.[1]);

            if (status !== 503 || attempt === maxAttempts) {
                throw error;
            }

            const delay = 1000 * (2 ** (attempt - 1));
            console.log(`Retrying after ${delay} ms...`);

            await sleep(delay);
        }
    }
}

testConnection().catch(error => {
    console.error("Connection test failed.");
    process.exitCode = 1;
});
