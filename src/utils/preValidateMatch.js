
import {
    hasTechnicalConflict
} from "./technicalTermGuard.js";

const normalize = (text) =>
    text.trim().toLowerCase().replace(/\s+/g, " ");

export const preValidateMatch = (cachedQuestion, incomingQuestion) => {
    if (
        typeof cachedQuestion !== "string" ||
        typeof incomingQuestion !== "string"
    ) {
        return {
            status: "UNKNOWN",
            reason: "Invalid question input"
        };
    }

    if (normalize(cachedQuestion) === normalize(incomingQuestion)) {
        return {
            status: "ACCEPT",
            reason: "Exact normalized match"
        };
    }

    if (hasTechnicalConflict(cachedQuestion, incomingQuestion)) {
        return {
            status: "REJECT",
            reason: "Conflicting technical terms"
        };
    }

    return {
        status: "UNKNOWN",
        reason: "Semantic equivalence not established"
    };
};
