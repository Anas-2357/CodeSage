import { Pinecone } from "@pinecone-database/pinecone";

let pinecone;

export function initPinecone() {
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }
    return pinecone;
}

const INDEX_NAME = process.env.PINECONE_INDEX;

export async function upsertVectors(client, vectors, indexName) {
    const index = client.Index(indexName);
    await index.upsert(vectors);
}

export async function queryVectors(client, vector, topK = 5) {
    const index = client.Index(INDEX_NAME);
    const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
    });
    return queryResponse.matches || [];
}

export async function waitForIndexReady(indexName, timeout = 60000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const description = await pinecone.describeIndex(indexName);
        if (description.status?.ready) {
            return true;
        }
        await new Promise((r) => setTimeout(r, 2000)); // wait 2s
    }

    throw new Error("Timed out waiting for Pinecone index to be ready");
}

export async function generateNewIndex(indexName) {
    await pinecone.createIndex({
        name: indexName,
        dimension: 1536,
        metric: "cosine",
        spec: {
            serverless: {
                cloud: "aws",
                region: "us-east-1",
            },
        },
    });

    // Wait for it to be ready (important in some environments)
    await waitForIndexReady(indexName);
}
