import dotenv from "dotenv";
import path from "path";

if (process.env.NODE_ENV !== "production") {
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}
console.log(
    "OPENAI_API_KEY:",
    process.env.OPENAI_API_KEY ? "Loaded" : "Missing"
);

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ingestRepo } from "./repoEmbedder.js";
import { generateEmbeddings } from "./openaiClient.js";
import { initPinecone, upsertVectors, queryVectors } from "./pineconeClient.js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
        const { query, topK = 5 } = req.body;

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

        // 4. Send a prompt to OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-nano",
            messages: [
                {
                    role: "system",
                    content: `You are an AI assistant that analyzes logic/data flow of a deature or a function.

- Only output a Mermaid flowchart showing the **logic/data flow** regarding the feature/function asked by user.
- Output only a syntactically correct Mermaid code block.
- Use this exact format:
- Do not use (), {}, '', or "" in the mermaid block because mermaid does not support them
- Also do not include nested square brackets like [[asdfsd] asdfsdf]

flowchart TD
A[function1] --> B[function2]
B --> C[function3]`,
                },
                {
                    role: "user",
                    content: `Here are some relevant code snippets:\n\n${contextText}\n\nMain question: Generate a Mermaid diagram of logic/data flow regarding ${query}.`,
                },
            ],
            temperature: 0.3,
        });

        const answer = completion.choices[0].message.content;
        res.json({ answer });
    } catch (error) {
        console.error("Error in /query:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
