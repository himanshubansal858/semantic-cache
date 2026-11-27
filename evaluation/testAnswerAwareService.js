import "dotenv/config";

import {
    validateCachedAnswer
} from "../src/services/answerAwareValidator.js";

const result = await validateCachedAnswer(
    "What is a binary tree?",
    "What is a binary search tree?",
    "A binary tree is a tree data structure where each node has at most two children."
);

console.log(result);