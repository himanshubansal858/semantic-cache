
export const SIMILARITY_THRESHOLD = 0.90;

export const evaluateCacheMatch = (match) => {
    if (!match) {
        return {
            cacheHit: false,
            message: "No matching cache entry found"
        };
    }

    if (match.similarity >= SIMILARITY_THRESHOLD) {
        return {
            cacheHit: true,
            ...match
        };
    }

    return {
        cacheHit: false,
        similarity: match.similarity,
        message: "Similarity below threshold"
    };
};
