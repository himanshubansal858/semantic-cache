
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { answerAwarePairs } from "./answerAwarePairs.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({ apiKey });

const modelName =
    process.env.TEST_GEMINI_MODEL || "gemini-3.5-flash-lite";

console.log("Evaluating with model:", modelName);

console.log("Using Gemini model:", modelName);

const buildPrompt = (item) => `
You are evaluating whether a cached answer can safely be reused.

Original cached question:
${JSON.stringify(item.cachedQuestion)}

New incoming question:
${JSON.stringify(item.incomingQuestion)}

Cached answer:
${JSON.stringify(item.cachedAnswer)}

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

let tp = 0, tn = 0, fp = 0, fn = 0;
let evaluated = 0;
let totalLatency = 0;

for (const [index, item] of answerAwarePairs.entries()) {
    try {
        const start = performance.now();

        const response = await ai.models.generateContent({
            model: modelName,
            contents: buildPrompt(item),
            config: {
                temperature: 0,
                maxOutputTokens: 20
            }
        });

        const latencyMs = performance.now() - start;
        const decision = response.text?.trim().toUpperCase();

        if (!["ACCEPT", "REJECT"].includes(decision)) {
            console.log({
                case: index + 1,
                error: "Invalid validator response",
                decision
            });
            continue;
        }

        totalLatency += latencyMs;
        evaluated++;

        const predicted = decision === "ACCEPT";
        const expected = item.expectedReuse;

        if (predicted && expected) tp++;
        else if (!predicted && !expected) tn++;
        else if (predicted) fp++;
        else fn++;

        console.log({
            case: index + 1,
            expected,
            predicted,
            decision,
            latencyMs: Number(latencyMs.toFixed(2))
        });

    } catch (error) {
        console.error(
            `Case ${index + 1} failed:`,
            error.message
        );

        const status =
            error.status ??
            error.code ??
            Number(error.message?.match(/"code":\s*(\d+)/)?.[1]);

        if ([400, 401, 403, 404, 429, 503].includes(Number(status))) {
            console.error(
                `Stopping evaluation after API error ${status}.`
            );
            break;
        }
    }
}

console.log("\nAnswer-Aware Results:", {
    evaluated,
    skipped: answerAwarePairs.length - evaluated,
    accuracy: evaluated
        ? `${(((tp + tn) / evaluated) * 100).toFixed(2)}%`
        : "N/A",
    precision: tp + fp
        ? `${((tp / (tp + fp)) * 100).toFixed(2)}%`
        : "N/A",
    recall: tp + fn
        ? `${((tp / (tp + fn)) * 100).toFixed(2)}%`
        : "N/A",
    averageLatencyMs: evaluated
        ? Number((totalLatency / evaluated).toFixed(2))
        : null,
    tp, tn, fp, fn
});
