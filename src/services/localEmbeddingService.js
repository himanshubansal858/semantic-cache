
import { pipeline } from "@huggingface/transformers";

const MODEL_NAME = "Xenova/all-mpnet-base-v2";

let extractorPromise = null;

async function getExtractor() {
    if (!extractorPromise) {
        extractorPromise = pipeline(
            "feature-extraction",
            MODEL_NAME,
            {
                device: "cpu",
                dtype: "q8"
            }
        ).catch(error => {
            extractorPromise = null;
            throw error;
        });
    }

    return extractorPromise;
}

export async function generateLocalEmbedding(text) {
    if (typeof text !== "string" || !text.trim()) {
        throw new Error("Text is required to generate embeddings");
    }

    const extractor = await getExtractor();

    const output = await extractor(text, {
        pooling: "mean",
        normalize: true
    });

    const embedding = Array.from(output.data);

    if (embedding.length !== 768) {
        throw new Error(
            `Expected 768 dimensions, received ${embedding.length}`
        );
    }

    return embedding;
}
