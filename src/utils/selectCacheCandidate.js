export const selectCacheCandidate = async (
    incomingQuestion,
    candidates,
    validateMatch,
    threshold = 0.90
) => {
    if (!Array.isArray(candidates)) {
        throw new Error("Candidates must be an array");
    }
    const normalize = (value) =>
        value.trim().toLowerCase().replace(/\s+/g, " ");

    const exactMatch = candidates.find(
        (candidate) =>
            typeof candidate.question === "string" &&
            normalize(candidate.question) === normalize(incomingQuestion)
    );

    if (exactMatch) {
        return {
            cacheHit: true,
            ...exactMatch,
            validationReason: "Exact normalized question match"
        };
    }
    for (const candidate of candidates) {
        if (
            !Number.isFinite(candidate.similarity) ||
            candidate.similarity < threshold
        ) {
            continue;
        }

        const result = await validateMatch(
            candidate.question,
            incomingQuestion
        );

        if (result.valid === true) {
            return {
                cacheHit: true,
                ...candidate,
                validationReason: result.reason
            };
        }
    }

    return {
        cacheHit: false,
        message: "No verified cache match found"
    };
};
