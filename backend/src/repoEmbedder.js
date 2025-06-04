import { encoding_for_model } from "tiktoken";
import pLimit from "p-limit";
import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import { generateEmbeddings } from "./openaiEmbeddingsClient.js";
import { upsertVectors } from "./pineconeClient.js";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const enc = encoding_for_model("text-embedding-3-small");

export async function ingestRepo(repoUrl, pineconeClient) {
    const tempDir = path.join(os.tmpdir(), `repo-${uuidv4()}`);
    const git = simpleGit();

    console.log("Cloning repo...");
    await git.clone(repoUrl, tempDir);

    console.log("Reading code files...");
    const codeFiles = getAllCodeFiles(tempDir);
    const totalFiles = codeFiles.length;

    const limit = pLimit(3);

    await Promise.all(
        codeFiles.map((file, index) =>
            limit(async () => {
                const content = fs.readFileSync(file, "utf-8");
                const chunks = splitIntoChunks(content);

                const embeddings = await generateEmbeddings(chunks);

                const vectors = embeddings.map((embedding, i) => ({
                    id: `${file}::chunk-${i}`,
                    values: embedding,
                    metadata: {
                        filePath: file.replace(tempDir, ""),
                        chunk: chunks[i],
                        repoUrl,
                    },
                }));

                // Optional: batch upsert if large
                await upsertVectors(pineconeClient, vectors);

                console.log(`✅ Processed ${index + 1} / ${totalFiles} files`);
            })
        )
    );

    return { message: `Ingested ${totalFiles} files from repo.` };
}

function getAllCodeFiles(dir, allFiles = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getAllCodeFiles(fullPath, allFiles);
        } else if (
            entry.isFile() &&
            /\.(js|ts|jsx|tsx|py|java|md|json|html|css)$/.test(entry.name)
        ) {
            allFiles.push(fullPath);
        }
    }
    return allFiles;
}

export function splitIntoChunks(text, maxTokens = 1000, overlap = 200) {
    const tokens = enc.encode(text);
    const chunks = [];

    let start = 0;
    while (start < tokens.length) {
        const end = Math.min(start + maxTokens, tokens.length);
        const chunkTokens = tokens.slice(start, end);

        const startCharIndex = enc.decode(tokens.slice(0, start)).length;
        const endCharIndex = enc.decode(tokens.slice(0, end)).length;

        const chunkText = text.slice(startCharIndex, endCharIndex);
        chunks.push(chunkText);

        start += maxTokens - overlap;
    }

    return chunks;
}
