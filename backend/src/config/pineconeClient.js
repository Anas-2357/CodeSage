import { Pinecone } from "@pinecone-database/pinecone";
import User from "../models/User.js";

let pinecone;

export function initPinecone() {
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }
    return pinecone;
}

export async function upsertVectors(pinecone, vectors, indexName, spaceName, spaceId, userId) {
    const index = pinecone.Index(indexName).namespace(spaceName);

    await index.upsert(vectors);

    const user = await User.findById(userId);
    user.repos.set(spaceName, spaceId)
    console.log(user.repos)
    await user.save();
}

export async function queryVectors(spaceId ,vector, indexName, topK = 5) {
    const index = pinecone.Index(indexName).namespace(spaceId);
    const queryResponse = await index.query({
        vector,
        topK,
        includeMetadata: true,
    });
    return queryResponse.matches || [];
}
