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

export async function upsertVectors(pinecone, vectors, indexName, spaceId) {
    const index = pinecone.Index(indexName).namespace(spaceId);

    await index.upsert(vectors);
}

export async function queryVectors(spaceId, vector, indexName, topK = 5) {
    const index = pinecone.Index(indexName).namespace(spaceId);
    const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
    });
    return queryResponse.matches || [];
}
