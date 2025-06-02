import dotenv from 'dotenv';
import path from 'path';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Missing');

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ingestRepo } from './repoEmbedder.js';
import { generateEmbedding } from './openaiClient.js';
import { initPinecone, upsertVectors, queryVectors } from './pineconeClient.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const pinecone = initPinecone();

app.post('/ingest-repo', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res
        .status(400)
        .json({ error: 'Missing repoUrl in request body' });
    }

    const result = await ingestRepo(repoUrl, pinecone);
    res.json(result);
  } catch (error) {
    console.error('Error in /ingest-repo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/upsert', async (req, res) => {
  try {
    const { id, text } = req.body;
    if (!id || !text) {
      return res
        .status(400)
        .json({ error: 'Missing id or text in body' });
    }

    const embeddingVector = await generateEmbedding(text);

    await upsertVectors(pinecone, [
      {
        id,
        values: embeddingVector,
        metadata: { text },
      },
    ]);

    return res.status(200).json({ message: 'Upsert successful' });
  } catch (error) {
    console.error('Error in /upsert:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/query', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query) {
      return res
        .status(400)
        .json({ error: 'Missing query in request body' });
    }

    // 1. Embed user query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Get topK relevant code chunks
    const results = await queryVectors(pinecone, queryEmbedding, topK);

    // 3. Extract and format the relevant chunks
    const contextText = results
      .map(
        (match) =>
          `File: ${match.metadata.filePath}\n${match.metadata.chunk}`
      )
      .join('\n---\n');

    // 4. Send a prompt to OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: `You are an expert AI developer who knows this entire codebase inside out.

You are always given the most relevant code for a question. If a feature is not present in that context, then it does not exist anywhere in the codebase — do not ask for more code or guess.

NEVER refer to "snippets", "provided code", or "files shown". Speak naturally and confidently, as if you’ve seen and understood the entire repo. Say “this repo” or “this codebase” instead.

If something is not present, clearly say that the repo does not implement it. Do not speculate or invent behavior. Be concise, technical, and honest.

Your job is to help the user understand how the code works — or tell them when it doesn’t exist.`,
        },
        {
          role: 'user',
          content: `Here are some relevant code snippets:\n\n${contextText}\n\nQuestion: ${query}\n\nAnswer in plain English.`,
        },
      ],
      temperature: 0.3,
    });

    const answer = completion.choices[0].message.content;
    res.json({ answer });
  } catch (error) {
    console.error('Error in /query:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
