import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function askGPT(query, contextText) {
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
                `
            },
            {
                role: "user",
                content: `Here are some relevant code snippets:\n\n${contextText}\n\nMain question: Explain the logic/data flow reagarding ${query}.`,
            },
        ],
        temperature: 0.3,
    });
    return completion.choices[0].message.content;
}










// Generate a Mermaid diagram of logic/data flow regarding

// - Only output a Mermaid flowchart showing the **logic/data flow** regarding the feature/function asked by user.
// - Output only a syntactically correct Mermaid code block.
// - Use this exact format:
// - Do not use (), {}, '', or "" in the mermaid block because mermaid does not support them
// - Also do not include nested square brackets like [[asdfsd] asdfsdf]

// flowchart TD
// A[function1] --> B[function2]
// B --> C[function3]`