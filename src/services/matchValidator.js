import { generateValidationResponse } from "./llmService.js";
const normalizeQuestion = (question) => {
    return question
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

export const validateSemanticMatch = async (
    originalQuestion,
    incomingQuestion
) => {
    if (
        typeof originalQuestion !== "string" ||
        typeof incomingQuestion !== "string"
    ) {
        return {
            valid: false,
            reason: "Invalid question input"
        };
    }

    const original = normalizeQuestion(originalQuestion);
    const incoming = normalizeQuestion(incomingQuestion);

    if (!original || !incoming) {
        return {
            valid: false,
            reason: "Empty question"
        };
    }

    if (original === incoming) {
        return {
            valid: true,
            reason: "Exact normalized question match"
        };
    }

    return {
        valid: false,
        reason: "Questions are not identical"
    };
};
export const validateMatchWithLLM = async (
    originalQuestion,
    incomingQuestion
) => {
    try {
        const prompt = buildValidationPrompt(
            originalQuestion,
            incomingQuestion
        );

        const response = await generateValidationResponse(prompt);

        // Remove Markdown code fences if Gemini includes them
        const cleanedResponse = response
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();

        const result = JSON.parse(cleanedResponse);

        if (typeof result.equivalent !== "boolean") {
            throw new Error("Invalid validator response");
        }

        return {
            valid: result.equivalent,
            error: false,
            reason: typeof result.reason === "string"
                ? result.reason
                : "No reason provided"
        };

    } catch (error) {
        console.error("LLM match validation failed:", error.message);

        return {
            valid: false,
            error: true,
            reason: "Validation service unavailable"
        };
    }
};
export const buildValidationPrompt = (
    originalQuestion,
    incomingQuestion
) => {
    return `
You are evaluating whether an existing cached answer can be
safely reused for a new question.

Original question:
${JSON.stringify(originalQuestion)}

Incoming question:
${JSON.stringify(incomingQuestion)}

Determine whether both questions request substantially
the same information and whether one answer would
appropriately satisfy both.

Rules:
- Related topics are not necessarily equivalent.
- Reject questions that ask about different concepts.
- Reject changes in constraints, numbers, or scope.
- Accept paraphrases that request the same information.
- When uncertain, reject the match.

Return only valid JSON:
{
  "equivalent": true,
  "reason": "Brief explanation"
}

Set equivalent to false when the questions are not interchangeable.
`;
};