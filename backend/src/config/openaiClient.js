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
Explain the logic/data flow of that feature using mermaid code that will be rendered on frontend.
Don't provide any plain text output instead return high level mermaid code and wrap labels in "" for connections between elements.
${complexityPara}
Also provide an object with keys exactly matching the element IDs used in the Mermaid diagram (e.g., A, B, C...), and each key should map to an object containing: filePath, start line number for that code line, function, and a description. Do not use function names or labels as keys. Always ensure consistency between the diagram IDs and the metadata object keys.
MAke sure that number of keys in object should be same as mermaid elements.
Here is a sample repsonse:
                
flowchart TD
    A[Loading URL failed. We can try to figure out why.] -->|Decode JSON| B(Please check the console to see the JSON and error details.)
    B --> C{Is the JSON correct?}
    C -->|Yes| D(Please Click here to Raise an issue in github.<br/>Including the broken link in the issue <br/> will speed up the fix.)
    C -->|No| E{Did someone <br/>send you this link?}
    E -->|Yes| F[Ask them to send <br/>you the complete link]
    E -->|No| G{Did you copy <br/> the complete URL?}


  "A": {
    "filePath": "/frontend/README.md",
    "startLine": "13",
    "funtion": "specialFunction.js"
    "description": "Validates user input fields such as email and password."
  },
  "B": {
    "filePath": "/frontend/README.md",
    "startLine": "13",
    "funtion": "specialFunction.js"
    "description": "Checks if the user already exists in the database."
  },
  "C": {
    "filePath": "/frontend/README.md",
    "startLine": "13",
    "funtion": "specialFunction.js"
    "description": "Hashes the user's password securely before storing."
  },
  "D": {
    "filePath": "/frontend/README.md",
    "startLine": "13",
    "funtion": "specialFunction.js"
    "description": "Creates and saves the user document to the database."
  },
  "E": {
    "filePath": "/frontend/README.md",
    "startLine": "13",
    "funtion": "specialFunction.js"
    "description": "Sends a welcome email to the newly registered user."
  }

                `,
            },
            {
                role: "user",
                content: `Here are some relevant code snippets:\n\n${contextText}\n\nMain question: Explain the logic/data flow reagarding ${query}.`,
            },
        ],
        temperature: 0.3,
    });
    console.log(completion.choices[0].message.content);

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

    return { response: completion.choices[0].message.content };
}
