import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ingestRepo } from './repoEmbedder.js';
import { generateEmbedding } from './openaiClient.js';
import { initPinecone, upsertVectors, queryVectors } from './pineconeClient.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const pinecone = initPinecone();

app.post('/ingest-repo', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'Missing repoUrl in request body' });
    }

    const result = await ingestRepo(repoUrl, pinecone);
    res.json(result);
  } catch (error) {
    console.error('Error in /ingest-repo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/upsert", async (req, res) => {
  try {
    const { id, text } = req.body;
    if (!id || !text) {
      return res.status(400).json({ error: "Missing id or text in body" });
    }

    const embeddingVector = await generateEmbedding(text);

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

app.post('/query', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing query in request body' });
    }

    const queryEmbedding = await generateEmbedding(query);

    const results = await queryVectors(pinecone, queryEmbedding, topK);

    res.json({ matches: results });
  } catch (error) {
    console.error('Error in /query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
