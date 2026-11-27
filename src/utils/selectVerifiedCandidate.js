
import { preValidateMatch } from "./preValidateMatch.js";

export const selectVerifiedCandidate = async (
    incomingQuestion,
    candidates,
    semanticValidator = null,
    threshold = 0.90
) => {
    if (typeof incomingQuestion !== "string") {
        throw new TypeError("Incoming question must be a string");
    }

    if (!Array.isArray(candidates)) {
        throw new TypeError("Candidates must be an array");
    }
    const VALIDATION_BUDGET_MS = 2000;
    const deadline = performance.now() + VALIDATION_BUDGET_MS;
    for (const candidate of candidates) {
        if (
            !candidate ||
            typeof candidate.question !== "string" ||
            !Number.isFinite(candidate.similarity) ||
            candidate.similarity < threshold
        ) {
            continue;
        }

        const decision = preValidateMatch(
            candidate.question,
            incomingQuestion
        );

        if (decision.status === "ACCEPT") {
            return {
                cacheHit: true,
                ...candidate,
                validationReason: decision.reason
            };
        }

        if (decision.status === "REJECT") {
            continue;
        }

        // UNKNOWN is not automatically a cache hit.
        if (typeof semanticValidator !== "function") {
            continue;
        }
        const remainingMs = deadline - performance.now();

        if (remainingMs <= 0) {
            break;
        }
        try {

            const validationPromise = Promise.resolve().then(() =>
                semanticValidator(
                    candidate.question,
                    incomingQuestion,
                    candidate.answer,
                    remainingMs
                )
            );

            let timer;

            const timeoutPromise = new Promise((_, reject) => {
                timer = setTimeout(() => {
                    reject(new Error("Validation deadline exceeded"));
                }, remainingMs);
            });

            let result;

            try {
                result = await Promise.race([
                    validationPromise,
                    timeoutPromise
                ]);
            } finally {
                clearTimeout(timer);
            }


            if (result?.valid === true) {
                return {
                    cacheHit: true,
                    ...candidate,
                    validationReason:
                        result.reason ?? "Semantic validator accepted"
                };
            }
        } catch (error) {
            // Fail closed: do not reuse an unverified cached answer.
            console.warn(
                "Semantic validation failed:",
                error.message
            );
        }
    }

    return {
        cacheHit: false,
        message: "No verified cache match found"
    };
};
