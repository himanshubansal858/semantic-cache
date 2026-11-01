
import "dotenv/config";
import { generateEmbedding } from "./src/services/embeddingService.js";
import { cosineSimilarity } from "./src/utils/similarity.js";

const test = async () => {
    try {
        const question1 = "How can I learn Java programming?";
        const question2 = "What is the best way to study Java?";

        const embedding1 = await generateEmbedding(question1);
        const embedding2 = await generateEmbedding(question2);

        const similarity = cosineSimilarity(embedding1, embedding2);

        console.log("Vector dimensions:", embedding1.length);
        console.log("Cosine similarity:", similarity);

    } catch (error) {
        console.error(error.message);
    }
};

test();
