import { ingestRepo } from "../config/repoEmbedder.js";
import { initPinecone } from "../config/pineconeClient.js";

const pinecone = initPinecone();

export const ingestRepository = async (req, res) => {
    try {
        const { repoUrl, namespace, dryrun } = req.body;
        if (!repoUrl) {
            return res.status(400).json({ error: "Missing repoUrl" });
        }
        if (!namespace) {
            return res.status(400).json({ error: "Missing namespace" });
        }

        const result = await ingestRepo(
            req.userId,
            repoUrl,
            pinecone,
            "codesage-prod",
            namespace,
            dryrun
        );
        res.json(result);
    } catch (err) {
        console.error("Repo ingestion error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
