import dotenv from "dotenv";
import path from "path";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ingestRepo } from "./repoEmbedder.js";
import { generateEmbeddings } from "./openaiEmbeddingsClient.js";
import { initPinecone, upsertVectors, queryVectors } from "./pineconeClient.js";
import { askGPT } from "./openaiClient.js";
import { compressChunksWithGemini } from "./geminiClient.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

const pinecone = initPinecone();

app.get("/", (req, res) => {
    res.status(200).send("OK");
});

app.post("/ingest-repo", async (req, res) => {
    try {
        const { repoUrl } = req.body;
        if (!repoUrl) {
            return res
                .status(400)
                .json({ error: "Missing repoUrl in request body" });
        }

        const result = await ingestRepo(repoUrl, pinecone);
        res.json(result);
    } catch (error) {
        console.error("Error in /ingest-repo:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/upsert", async (req, res) => {
    try {
        const { id, text } = req.body;
        if (!id || !text) {
            return res
                .status(400)
                .json({ error: "Missing id or text in body" });
        }

        const embeddingVector = await generateEmbeddings(text);

        await upsertVectors(pinecone, [
            {
                id,
                values: embeddingVector,
                metadata: { text },
            },
        ]);

        return res.status(200).json({ message: "Upsert successful" });
    } catch (error) {
        console.error("Error in /upsert:", error);
        return res.status(500).json({ error: error.message });
    }
});

app.post("/query", async (req, res) => {
    try {
        const { query, mermaidComplexity = 2 } = req.body;
        const topK = 200;

        if (!query) {
            return res
                .status(400)
                .json({ error: "Missing query in request body" });
        }

        // 1. Embed user query
        const queryEmbedding = await generateEmbeddings(query);

        // 2. Get topK relevant code chunks
        const results = await queryVectors(pinecone, queryEmbedding, topK);

        // 3. Extract and format the relevant chunks
        const contextText = results
            .map(
                (match) =>
                    `File: ${match.metadata.filePath}\n${match.metadata.chunk}`
            )
            .join("\n---\n");

            console.log("Received chunks from pinecone");
            console.log("Chunks sent to gimini");
            console.log("Waiting for gimini's response...");

        const contentCompressedbyGemini = await compressChunksWithGemini(contextText, query);

            console.log("Received gimini's response and sent them to GPT")
            console.log("Waiting for GPT's response...")

        const responseByGPT = await askGPT(query, contentCompressedbyGemini, mermaidComplexity);
        // const responseByGPT = contentCompressbyGemini;
        console.log(`Final response by GPT ${responseByGPT}`);

        // const answer = responseByGPT.choices[0].message.content;
        res.json(responseByGPT);
    } catch (error) {
        console.error("Error in /query:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
