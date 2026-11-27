
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL =
    process.env.VALIDATOR_GEMINI_MODEL || "gemini-3.5-flash-lite";

export const validateCachedAnswer = async (
    cachedQuestion,
    incomingQuestion,
    cachedAnswer,
    timeoutMs = 2000
) => {
    if (
        typeof cachedQuestion !== "string" ||
        typeof incomingQuestion !== "string" ||
        typeof cachedAnswer !== "string"
    ) {
        return {
            valid: false,
            reason: "Invalid validation input"
        };
    }

    const prompt = `
You are evaluating whether a cached answer can safely be reused.

Original cached question:
${JSON.stringify(cachedQuestion)}

New incoming question:
${JSON.stringify(incomingQuestion)}

Cached answer:
${JSON.stringify(cachedAnswer)}

Determine whether the cached answer adequately and correctly
answers the new incoming question.

Rules:
- Evaluate the actual cached answer, not merely question similarity.
- Reject answers that explain a different technical concept.
- Reject answers missing essential information needed by the new question.
- Accept concise but sufficient answers.
- Do not generate a replacement answer.

Return only one word: ACCEPT or REJECT.
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                temperature: 0,
                maxOutputTokens: 20,
                abortSignal: AbortSignal.timeout(
                    Math.max(1, Math.floor(timeoutMs))
                )
            }
        });

        const decision = response.text?.trim().toUpperCase();

        if (decision === "ACCEPT") {
            return {
                valid: true,
                reason: "Cached answer validated"
            };
        }

        return {
            valid: false,
            reason: decision === "REJECT"
                ? "Cached answer insufficient or incorrect"
                : "Unrecognized validation response"
        };

    } catch (error) {
        console.warn("Answer-aware validation failed:", error.message);

        // Fail closed: never accept unverified cached answers.
        return {
            valid: false,
            reason: "Validator unavailable"
        };
    }
};
