import { generateEmbeddings } from "../config/openaiEmbeddingsClient.js";
import { queryVectors } from "../config/pineconeClient.js";
import { compressChunksWithGemini } from "../config/geminiClient.js";
import { askGPT } from "../config/openaiClient.js";

export const query = async (req, res) => {
    try {
        const { query, indexName, mermaidComplexity = 2 } = req.body;
        const topK = 200;

        if (!query) {
            return res.status(400).json({ error: "Missing query" });
        }

        const queryEmbedding = await generateEmbeddings(query);
        const results = await queryVectors(queryEmbedding, indexName, topK);

        const contextText = results
            .map(match => `File: ${match.metadata.filePath}\n${match.metadata.chunk}`)
            .join("\n---\n");

        const compressed = await compressChunksWithGemini(contextText, query);
        const gptResponse = await askGPT(query, compressed, mermaidComplexity);

        res.json(gptResponse);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
