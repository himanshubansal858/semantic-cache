
import { generateAnswer } from "../services/llmService.js";

export const askQuestion = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question is required"
            });
        }

        const answer = await generateAnswer(question);

        return res.status(200).json({
            success: true,
            question,
            answer
        });

    } catch (error) {
        console.error("Controller Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to generate answer"
        });
    }
};
