
export const MAX_QUESTION_LENGTH = 2000;

export const validateQuestion = (question) => {
    if (typeof question !== "string") {
        return {
            valid: false,
            message: "Question must be a string"
        };
    }

    const normalized = question.trim();

    if (!normalized) {
        return {
            valid: false,
            message: "Question cannot be empty"
        };
    }

    if (normalized.length > MAX_QUESTION_LENGTH) {
        return {
            valid: false,
            message: `Question must not exceed ${MAX_QUESTION_LENGTH} characters`
        };
    }

    return {
        valid: true,
        question: normalized
    };
};
