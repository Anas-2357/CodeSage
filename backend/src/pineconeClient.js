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

export async function upsertVectors(client, vectors) {
    const index = client.Index(INDEX_NAME);
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
