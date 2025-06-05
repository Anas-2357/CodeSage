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

export async function upsertVectors(pinecone, vectors, indexName, namespace) {
    const index = pinecone.Index(indexName).namespace(namespace);

    await index.upsert(vectors);
}

export async function queryVectors(vector, indexName, topK = 5) {
    const index = pinecone.Index(indexName);
    const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
    });
    return queryResponse.matches || [];
}
