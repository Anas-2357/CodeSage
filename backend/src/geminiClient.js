const MAX_INPUT_TOKENS_GEMINI = 30000; // tunable
const MAX_OUTPUT_TOKENS_GEMINI = 8000; // tunable

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

export async function compressChunksWithGemini(textChunks, query) {
    const prompt = `Compress the following code into a much smaller version that still preserves logic and relationships related to ${query}. Output must stay under ${MAX_OUTPUT_TOKENS_GEMINI} tokens of gpt:\n\n${textChunks}`;

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            maxOutputTokens: MAX_OUTPUT_TOKENS_GEMINI,
            temperature: 0.3,
        },
    });

    const response = result.response;
    return response.text();
}
