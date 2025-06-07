import OpenAI from "openai";
import User from "../models/User.js";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function askGPT(
    query,
    contextText,
    mermaidComplexity,
    userId = null
) {
    const complexityPara =
        mermaidComplexity === 1
            ? "Each element should be a function name, use as few elements as possible"
            : mermaidComplexity === 2
            ? "There should be a maximum of 25 elements"
            : "Provide as many elements as possible.";
    const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
            {
                role: "system",
                content: `You are an AI assistant that analyzes logic/data flow of a feature or a function.
                You are provided with most relavant code for that feature/function.
                Explain the logic/data flow of that feature.
                Provide highlevel data flow with elements being functions.
                Also provide a list regarding the work and element do.
                Don't provide any plain text output instead return high level mermaid code and wrap labels in "" for connections between elements.
                ${complexityPara}
                Also provide an object with keys as element names and value as object of that element which consists of file that element is present in, function in which this elment is present in and description for that element.
                `,
            },
            {
                role: "user",
                content: `Here are some relevant code snippets:\n\n${contextText}\n\nMain question: Explain the logic/data flow reagarding ${query}.`,
            },
        ],
        temperature: 0.3,
    });

    const inputTokens = completion.usage.prompt_tokens / 100;
    const outputTokens = completion.usage.completion_tokens / 25;

    if (userId) {
        const user = await User.findById(userId);
        user.tokens = user.tokens - (inputTokens + outputTokens);
        if (user.tokens < 0) user.tokens = 0;
        await user.save();

        const availableTokens = Number(user.tokens.toFixed(0));
        const totalTokens = Number((inputTokens + outputTokens).toFixed(0));

        return {
            response: completion.choices[0].message.content,
            totalTokens,
            availableTokens,
        };
    }

    return {response: completion.choices[0].message.content}
}
