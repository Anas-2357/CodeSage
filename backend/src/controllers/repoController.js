import { ingestRepo } from "../config/repoEmbedder.js";
import { generateNewIndex } from "../config/pineconeClient.js";
import { initPinecone } from "../config/pineconeClient.js";

const pinecone = initPinecone();

export const ingestRepository = async (req, res) => {
    try {
        const { repoUrl, indexName } = req.body;
        if (!repoUrl) {
            return res.status(400).json({ error: "Missing repoUrl" });
        }

        await generateNewIndex(indexName);
        const result = await ingestRepo(repoUrl, pinecone, indexName);
        res.json(result);
    } catch (err) {
        console.error("Repo ingestion error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
