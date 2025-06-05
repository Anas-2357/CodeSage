import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbeddings(texts) {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
    });
    return response.data.map((d) => d.embedding);
}
