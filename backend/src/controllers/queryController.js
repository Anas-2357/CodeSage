import { generateEmbeddings } from "../config/openaiEmbeddingsClient.js";
import { queryVectors } from "../config/pineconeClient.js";
import { compressChunksWithGemini } from "../config/geminiClient.js";
import { askGPT } from "../config/openaiClient.js";
import User from "../models/User.js";
import Repo from "../models/Repo.js";

export const query = async (req, res) => {
    try {
        const { query, mermaidComplexity = 2, spaceName } = req.body;
        const topK = 200;

        const userId = req.userId;
        const user = await User.findById(userId);

        if (user.tokens <= 0) {
            return res.status(429).json({ error: "You are out of tokens" });
        }

        if (!query) {
            return res.status(400).json({ error: "Missing query" });
        }

        if (!spaceName) {
            return res.status(400).json({ error: "Missing Space name" });
        }

        const [userRepo, publicRepo] = await Promise.all([
            Repo.findOne({ ownerId: userId, spaceName }),
            Repo.findOne({ isPublic: true, spaceName }),
        ]);

        var nameSpace = null;

        if (userRepo) {
            nameSpace = userRepo.nameSpace;
        } else if (publicRepo) {
            nameSpace = publicRepo.nameSpace
        }

        if (!nameSpace) {
            return res.status(400).json({ error: "This space does not exist" });
        }

        console.time("Embed Query");
        const queryEmbedding = await generateEmbeddings(query);
        console.timeEnd("Embed Query");

        console.time("Query Vectors");
        const results = await queryVectors(
            nameSpace,
            queryEmbedding,
            "codesage-prod",
            topK
        );
        console.timeEnd("Query Vectors");

        const contextText = results
            .map(
                (match) =>
                    `File: ${match.metadata.filePath}\n${match.metadata.chunk}`
            )
            .join("\n---\n");

        console.time("Request GIMINI");
        const compressed = await compressChunksWithGemini(contextText, query);
        console.timeEnd("Request GIMINI");
        
        console.time("Request GPT");
        const gptResponse = await askGPT(
            query,
            compressed,
            mermaidComplexity,
            userId,
        );
        console.timeEnd("Request GPT");

        res.json(gptResponse);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const guestQuery = async (req, res) => {
    try {
        const { query, mermaidComplexity = 2, spaceName } = req.body;
        const topK = 200;

        if (!query) {
            return res.status(400).json({ error: "Missing query" });
        }

        if (!spaceName) {
            return res.status(400).json({ error: "Missing Space name" });
        }

        const publicRepo = await Repo.findOne({ isPublic: true, spaceName })

        const nameSpace = null;

        if (publicRepo) {
            nameSpace = publicRepo.nameSpace
        }

        if (nameSpace) {
            return res.status(400).json({ error: "This space does not exist" });
        }

        const queryEmbedding = await generateEmbeddings(query);
        const results = await queryVectors(
            nameSpace,
            queryEmbedding,
            "codesage-prod",
            topK
        );

        const contextText = results
            .map(
                (match) =>
                    `File: ${match.metadata.filePath}\n${match.metadata.chunk}`
            )
            .join("\n---\n");

        const compressed = await compressChunksWithGemini(contextText, query);
        const gptResponse = await askGPT(
            query,
            compressed,
            mermaidComplexity,
        );

        res.json(gptResponse);
    } catch (err) {
        console.error("Query error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};