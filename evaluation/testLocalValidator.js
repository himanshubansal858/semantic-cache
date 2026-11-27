
import {
    AutoTokenizer,
    AutoModelForSequenceClassification
} from "@huggingface/transformers";

const modelId = "cross-encoder/quora-distilroberta-base";

console.log("Loading local classification model...");

const tokenizer = await AutoTokenizer.from_pretrained(modelId);

const model = await AutoModelForSequenceClassification.from_pretrained(
    modelId,
    { dtype: "fp32" }
);

console.log("Model loaded successfully.");

// Run diagnostics only after both are initialized.
const question = "What is Java?";

const singleQuestion = tokenizer(question);

const samePair = tokenizer(question, {
    text_pair: question
});

const differentPair = tokenizer(question, {
    text_pair: "What is Python?"
});

console.log("Tokenization diagnostics:", {
    singleLength: singleQuestion.input_ids.data.length,
    samePairLength: samePair.input_ids.data.length,
    differentPairLength: differentPair.input_ids.data.length
});

for (const [label, inputs] of [
    ["Same question", samePair],
    ["Different question", differentPair]
]) {
    const output = await model(inputs);

    const logit = Number(output.logits.data[0]);
    const score = 1 / (1 + Math.exp(-logit));

    console.log(label, {
        logit,
        score
    });
}
