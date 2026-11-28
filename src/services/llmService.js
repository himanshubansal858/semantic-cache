
import {
    incrementMetric,
    METRIC_NAMES
} from "./metricsService.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

export const generateAnswer = async (question) => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is missing");
    }

    const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

    try {
        const response = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful technical assistant. Provide accurate, clear, and complete answers. Keep explanations concise unless detailed information is requested."
                    },
                    {
                        role: "user",
                        content: question
                    }
                ],
                temperature: 0.2,
                reasoning_effort: "low",
                max_completion_tokens: 4096
            }),
            signal: AbortSignal.timeout(30000)
        });

        await incrementMetric(METRIC_NAMES.LLM_CALLS);

        if (!response.ok) {
            const details = await response.text();
            const error = new Error(
                `Groq API error ${response.status}: ${details.slice(0, 300)}`
            );

            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        const finishReason = data.choices?.[0]?.finish_reason;

        if (finishReason === "length") {
            throw new Error(
                "Groq response was truncated because the token limit was reached"
            );
        }
        const answer = data.choices?.[0]?.message?.content;

        if (!answer || !answer.trim()) {
            throw new Error("Groq returned an empty answer");
        }

        return answer.trim();

    } catch (error) {
        console.error("Groq API Error:", error.message);
        throw error;
    }
};

export const generateAnswerWithRetry = async (question) => {
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await generateAnswer(question);
        } catch (error) {
            const retryable =
                error.status === 503 ||
                error.status === 502 ||
                error.status === 504;

            if (!retryable || attempt === MAX_ATTEMPTS) {
                throw error;
            }

            const delay = 1000 * (2 ** (attempt - 1));

            console.warn(
                `Groq temporary failure. Retrying in ${delay}ms`
            );

            await sleep(delay);
        }
    }
};

export const generateValidationResponse = async (prompt) => {
    return await generateAnswerWithRetry(prompt);
};
